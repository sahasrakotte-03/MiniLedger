import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../app';
import { prisma } from '../db/prisma';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal valid JPEG (SOI + APP0 + EOI)
const JPEG_MIN = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

describe('MiniLedger receipt upload API', () => {
  let token: string;
  const uploadedFiles: string[] = [];
  const uploadDir = path.resolve(__dirname, '../../uploads');

  beforeAll(async () => {
    await prisma.loan.deleteMany({ where: { user: { phoneNumber: '+919888888881' } } });
    await prisma.otpChallenge.deleteMany({ where: { phoneNumber: '+919888888881' } });
    await prisma.user.deleteMany({ where: { phoneNumber: '+919888888881' } });

    await prisma.user.create({
      data: { phoneNumber: '+919888888881', name: 'Upload Tester' },
    });
    await prisma.otpChallenge.create({
      data: {
        phoneNumber: '+919888888881',
        otp: '333333',
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const loginRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: '9888888881', otp: '333333' });
    token = loginRes.body.data.token;
  });

  afterAll(async () => {
    for (const filename of uploadedFiles) {
      const full = path.join(uploadDir, filename);
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
      }
    }
    await prisma.otpChallenge.deleteMany({ where: { phoneNumber: '+919888888881' } });
    await prisma.user.deleteMany({ where: { phoneNumber: '+919888888881' } });
    await prisma.$disconnect();
  });

  it('rejects unauthenticated uploads', async () => {
    const res = await request(app)
      .post('/api/upload/receipt')
      .attach('receipt', PNG_1X1, { filename: 'receipt.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('stores a PNG sent as multipart field "receipt"', async () => {
    const res = await request(app)
      .post('/api/upload/receipt')
      .set('Authorization', `Bearer ${token}`)
      .attach('receipt', PNG_1X1, { filename: 'receipt.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toMatch(/^\/uploads\/receipt_/);
    expect(res.body.data.mimetype).toBe('image/png');
    expect(res.body.data.size).toBe(PNG_1X1.length);

    const stored = path.join(uploadDir, res.body.data.filename);
    expect(fs.existsSync(stored)).toBe(true);
    expect(fs.readFileSync(stored).equals(PNG_1X1)).toBe(true);
    uploadedFiles.push(res.body.data.filename);
  });

  it('stores a JPEG sent as multipart field "receipt"', async () => {
    const res = await request(app)
      .post('/api/upload/receipt')
      .set('Authorization', `Bearer ${token}`)
      .attach('receipt', JPEG_MIN, { filename: 'receipt.jpeg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.size).toBe(JPEG_MIN.length);

    const stored = path.join(uploadDir, res.body.data.filename);
    expect(fs.readFileSync(stored).equals(JPEG_MIN)).toBe(true);
    uploadedFiles.push(res.body.data.filename);
  });

  it('stores a JPG with image/jpg content type', async () => {
    const res = await request(app)
      .post('/api/upload/receipt')
      .set('Authorization', `Bearer ${token}`)
      .attach('receipt', JPEG_MIN, { filename: 'receipt.jpg', contentType: 'image/jpg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    uploadedFiles.push(res.body.data.filename);
  });

  it('rejects non-image files with a clear message', async () => {
    const res = await request(app)
      .post('/api/upload/receipt')
      .set('Authorization', `Bearer ${token}`)
      .attach('receipt', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid file type/i);
  });

  it('rejects the wrong multipart field name', async () => {
    const res = await request(app)
      .post('/api/upload/receipt')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG_1X1, { filename: 'receipt.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects files larger than 5 MB', async () => {
    const tooBig = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);
    const res = await request(app)
      .post('/api/upload/receipt')
      .set('Authorization', `Bearer ${token}`)
      .attach('receipt', tooBig, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too large/i);
  });
});
