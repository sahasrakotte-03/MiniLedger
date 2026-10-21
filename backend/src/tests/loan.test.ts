import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('MiniLedger Loan Management APIs', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let userALoanId: string;

  beforeAll(async () => {
    // Clean database test users
    await prisma.loan.deleteMany({});
    await prisma.otpChallenge.deleteMany({});
    await prisma.user.deleteMany({});

    // Setup User A
    const userA = await prisma.user.create({
      data: { phoneNumber: '+919999999991', name: 'User A' },
    });
    userAId = userA.id;

    // Setup User B
    const userB = await prisma.user.create({
      data: { phoneNumber: '+919999999992', name: 'User B' },
    });
    userBId = userB.id;

    // Login User A via verify-otp flow to get genuine JWT
    await prisma.otpChallenge.create({
      data: {
        phoneNumber: '+919999999991',
        otp: '111111',
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const loginARes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: '9999999991', otp: '111111' });
    userAToken = loginARes.body.data.token;

    // Login User B via verify-otp flow
    await prisma.otpChallenge.create({
      data: {
        phoneNumber: '+919999999992',
        otp: '222222',
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const loginBRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: '9999999992', otp: '222222' });
    userBToken = loginBRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({});
    await prisma.otpChallenge.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('rejects unauthenticated requests without Bearer token', async () => {
    const res = await request(app).get('/api/loans');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('validates loan creation inputs (rejects empty name and non-positive amount)', async () => {
    // Test empty friend name
    const res1 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        friendName: '',
        amount: 500,
        dueDate: '2026-11-01',
      });
    expect(res1.status).toBe(400);
    expect(res1.body.error).toContain('Friend name cannot be empty');

    // Test negative / zero amount
    const res2 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        friendName: 'Rahul Sharma',
        amount: -100,
        dueDate: '2026-11-01',
      });
    expect(res2.status).toBe(400);
    expect(res2.body.error).toContain('positive number');
  });

  it('creates a new loan for User A successfully', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        friendName: 'Aarav Patel',
        amount: 2500,
        dueDate: '2026-12-15',
        notes: 'Dinner and movie split',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.friendName).toBe('Aarav Patel');
    expect(res.body.data.amount).toBe(2500);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.amountFormatted).toContain('₹');
    userALoanId = res.body.data.id;
  });

  it('enforces user ownership restrictions (User B cannot view User A loan)', async () => {
    const res = await request(app)
      .get(`/api/loans/${userALoanId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Access denied');
  });

  it('enforces user ownership restrictions (User B cannot edit or repay User A loan)', async () => {
    const editRes = await request(app)
      .patch(`/api/loans/${userALoanId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ friendName: 'Malicious Change' });
    expect(editRes.status).toBe(403);

    const repayRes = await request(app)
      .patch(`/api/loans/${userALoanId}/repay`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(repayRes.status).toBe(403);
  });

  it('allows User A to update loan details', async () => {
    const res = await request(app)
      .patch(`/api/loans/${userALoanId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        amount: 3000,
        notes: 'Updated dinner split + uber',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(3000);
    expect(res.body.data.notes).toBe('Updated dinner split + uber');
  });

  it('allows User A to mark pending loan as repaid', async () => {
    const res = await request(app)
      .patch(`/api/loans/${userALoanId}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REPAID');
  });

  it('rejects duplicate repayment operations on already repaid loans', async () => {
    const res = await request(app)
      .patch(`/api/loans/${userALoanId}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already been marked as repaid');
  });

  it('allows User A to delete their own loan record', async () => {
    const res = await request(app)
      .delete(`/api/loans/${userALoanId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify deletion
    const getRes = await request(app)
      .get(`/api/loans/${userALoanId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(getRes.status).toBe(404);
  });
});
