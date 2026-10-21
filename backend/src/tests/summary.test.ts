import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('MiniLedger Dynamic Financial Summary & Calendar Date Calculations', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // Clean test data
    await prisma.loan.deleteMany({});
    await prisma.otpChallenge.deleteMany({});
    await prisma.user.deleteMany({});

    // Setup Test User
    const user = await prisma.user.create({
      data: { phoneNumber: '+919811122233', name: 'Summary Test User' },
    });
    userId = user.id;

    // Login user
    await prisma.otpChallenge.create({
      data: {
        phoneNumber: '+919811122233',
        otp: '333333',
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const loginRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: '9811122233', otp: '333333' });
    userToken = loginRes.body.data.token;

    // Create 3 specific loans:
    // Loan 1: Repaid Loan, Amount = ₹3,000, Due date: future
    await prisma.loan.create({
      data: {
        userId,
        friendName: 'Pooja',
        amount: 3000,
        dueDate: new Date(Date.now() + 7 * 86400000),
        status: 'REPAID',
      },
    });

    // Loan 2: Pending active loan, Amount = ₹2,000, Due date: future (in 5 days)
    await prisma.loan.create({
      data: {
        userId,
        friendName: 'Vikram',
        amount: 2000,
        dueDate: new Date(Date.now() + 5 * 86400000),
        status: 'PENDING',
      },
    });

    // Loan 3: Overdue pending loan, Amount = ₹1,500, Due date: past (10 days ago)
    await prisma.loan.create({
      data: {
        userId,
        friendName: 'Rohan',
        amount: 1500,
        dueDate: new Date(Date.now() - 10 * 86400000),
        status: 'PENDING',
      },
    });

    // Loan 4: Repaid loan with past due date, Amount = ₹1,000 (should NOT count as overdue because it's repaid!)
    await prisma.loan.create({
      data: {
        userId,
        friendName: 'Sneha',
        amount: 1000,
        dueDate: new Date(Date.now() - 15 * 86400000),
        status: 'REPAID',
      },
    });
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({});
    await prisma.otpChallenge.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('calculates dynamic financial summary correctly from PostgreSQL', async () => {
    const res = await request(app)
      .get('/api/loans/summary')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    // Expected values:
    // Total Lent = 3000 + 2000 + 1500 + 1000 = 7500
    // Total Repaid = 3000 + 1000 = 4000
    // Overdue Amount = 1500 (only Loan 3 is PENDING with past due date)
    expect(data.totalLent).toBe(7500);
    expect(data.totalRepaid).toBe(4000);
    expect(data.overdueAmount).toBe(1500);

    // Formatted INR strings
    expect(data.totalLentFormatted).toContain('₹');
    expect(data.totalLentFormatted).toContain('7,500');
    expect(data.totalRepaidFormatted).toContain('4,000');
    expect(data.overdueAmountFormatted).toContain('1,500');

    // Counts
    expect(data.totalLoansCount).toBe(4);
    expect(data.pendingCount).toBe(2);
    expect(data.repaidCount).toBe(2);
    expect(data.overdueCount).toBe(1);
  });

  it('filters loans list correctly by OVERDUE status', async () => {
    const res = await request(app)
      .get('/api/loans?status=OVERDUE')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].friendName).toBe('Rohan');
    expect(res.body.data[0].isOverdue).toBe(true);
  });

  it('dynamically recalculates summary when a pending overdue loan is repaid', async () => {
    // Find the overdue loan
    const overdueLoan = await prisma.loan.findFirst({
      where: { userId, friendName: 'Rohan' },
    });

    // Repay it
    await request(app)
      .patch(`/api/loans/${overdueLoan!.id}/repay`)
      .set('Authorization', `Bearer ${userToken}`);

    // Query summary again
    const res = await request(app)
      .get('/api/loans/summary')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;

    // Overdue amount should drop from 1500 to 0
    expect(data.overdueAmount).toBe(0);
    expect(data.overdueCount).toBe(0);

    // Total Repaid should increase by 1500 (from 4000 to 5500)
    expect(data.totalRepaid).toBe(5500);

    // Total Lent remains unchanged (7500)
    expect(data.totalLent).toBe(7500);
  });
});
