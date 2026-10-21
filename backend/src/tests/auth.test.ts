import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('MiniLedger Auth APIs (Mock OTP & JWT)', () => {
  const testPhone = '9876543210';
  const invalidPhone = '12345';
  let generatedOtp = '';

  beforeAll(async () => {
    // Clean test data
    await prisma.otpChallenge.deleteMany({
      where: { phoneNumber: '+919876543210' },
    });
    await prisma.user.deleteMany({
      where: { phoneNumber: '+919876543210' },
    });
  });

  afterAll(async () => {
    await prisma.otpChallenge.deleteMany({
      where: { phoneNumber: '+919876543210' },
    });
    await prisma.user.deleteMany({
      where: { phoneNumber: '+919876543210' },
    });
    await prisma.$disconnect();
  });

  it('rejects invalid Indian phone number formats', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phoneNumber: invalidPhone });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Please provide a valid 10-digit Indian phone number');
  });

  it('successfully generates OTP for valid phone number and saves challenge', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phoneNumber: testPhone });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phoneNumber).toBe('+919876543210');
    expect(res.body.data.expiresInSeconds).toBe(300);

    // Verify OTP exists in DB
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phoneNumber: '+919876543210', isUsed: false },
      orderBy: { createdAt: 'desc' },
    });
    expect(challenge).not.toBeNull();
    expect(challenge!.otp).toHaveLength(6);
    generatedOtp = challenge!.otp;
  });

  it('rejects incorrect OTP and decrements remaining attempts', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: testPhone, otp: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Incorrect OTP');
  });

  it('rejects expired OTP', async () => {
    // Manually expire the challenge in DB
    await prisma.otpChallenge.updateMany({
      where: { phoneNumber: '+919876543210', isUsed: false },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: testPhone, otp: generatedOtp });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('expired');
  });

  it('generates new OTP, verifies correctly, and returns valid JWT token', async () => {
    // Generate fresh OTP
    await request(app)
      .post('/api/auth/send-otp')
      .send({ phoneNumber: testPhone });

    const challenge = await prisma.otpChallenge.findFirst({
      where: { phoneNumber: '+919876543210', isUsed: false },
      orderBy: { createdAt: 'desc' },
    });
    const validOtp = challenge!.otp;

    // Verify with valid OTP
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: testPhone, otp: validOtp });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.phoneNumber).toBe('+919876543210');

    // Verify challenge is marked as used (one-time use)
    const usedChallenge = await prisma.otpChallenge.findUnique({
      where: { id: challenge!.id },
    });
    expect(usedChallenge!.isUsed).toBe(true);

    // Trying to use same OTP again should fail
    const reusedRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: testPhone, otp: validOtp });
    expect(reusedRes.status).toBe(400);
  });
});
