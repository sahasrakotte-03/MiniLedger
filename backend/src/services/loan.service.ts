import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';
import { CreateLoanInput, UpdateLoanInput, ListLoansQuery } from '../validators/loan.validator';
import { parseDueDate, getStartOfTodayUTC, isLoanOverdue, formatDateReadable } from '../utils/date';
import { formatINR } from '../utils/format';
import { LoanSummaryDto } from '../types';

export class LoanService {
  /**
   * Helper to format a loan model for API responses
   */
  private static formatLoanResponse(loan: any) {
    const overdue = isLoanOverdue(loan.dueDate, loan.status);
    const amountNum = typeof loan.amount?.toNumber === 'function' ? loan.amount.toNumber() : Number(loan.amount);

    return {
      id: loan.id,
      userId: loan.userId,
      friendName: loan.friendName,
      amount: amountNum,
      amountFormatted: formatINR(amountNum),
      dueDate: loan.dueDate.toISOString(),
      dueDateFormatted: formatDateReadable(loan.dueDate),
      status: loan.status,
      isOverdue: overdue,
      receiptUrl: loan.receiptUrl || null,
      notes: loan.notes || null,
      createdAt: loan.createdAt.toISOString(),
      updatedAt: loan.updatedAt.toISOString(),
    };
  }

  /**
   * Create a new loan record
   */
  static async createLoan(userId: string, input: CreateLoanInput) {
    const parsedDate = parseDueDate(input.dueDate);
    const decimalAmount = new Prisma.Decimal(input.amount);

    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: input.friendName.trim(),
        amount: decimalAmount,
        dueDate: parsedDate,
        status: 'PENDING',
        receiptUrl: input.receiptUrl || null,
        notes: input.notes?.trim() || null,
      },
    });

    return this.formatLoanResponse(loan);
  }

  /**
   * Get all loans for a user with search, filtering, and sorting
   */
  static async getLoans(userId: string, query: ListLoansQuery) {
    const whereClause: Prisma.LoanWhereInput = {
      userId,
    };

    // Search by friend name (case-insensitive)
    if (query.search && query.search.trim().length > 0) {
      whereClause.friendName = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    const startOfToday = getStartOfTodayUTC();

    // Status filtering
    if (query.status === 'PENDING') {
      whereClause.status = 'PENDING';
    } else if (query.status === 'REPAID') {
      whereClause.status = 'REPAID';
    } else if (query.status === 'OVERDUE') {
      whereClause.status = 'PENDING';
      whereClause.dueDate = { lt: startOfToday };
    }

    // Sorting
    const orderBy: Prisma.LoanOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'dueDate';
    const sortOrder = query.order || (sortField === 'dueDate' ? 'asc' : 'desc');

    if (sortField === 'dueDate') {
      orderBy.dueDate = sortOrder;
    } else if (sortField === 'amount') {
      orderBy.amount = sortOrder;
    } else if (sortField === 'friendName') {
      orderBy.friendName = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      orderBy,
    });

    return loans.map((loan) => this.formatLoanResponse(loan));
  }

  /**
   * Get single loan details by ID with ownership enforcement
   */
  static async getLoanById(userId: string, loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    if (loan.userId !== userId) {
      throw new AppError('Access denied: You do not have permission to view this loan record', 403);
    }

    return this.formatLoanResponse(loan);
  }

  /**
   * Update loan details with ownership enforcement
   */
  static async updateLoan(userId: string, loanId: string, input: UpdateLoanInput) {
    const existing = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!existing) {
      throw new AppError('Loan not found', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('Access denied: You do not have permission to modify this loan record', 403);
    }

    const updateData: Prisma.LoanUpdateInput = {};

    if (input.friendName !== undefined) {
      updateData.friendName = input.friendName.trim();
    }

    if (input.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(input.amount);
    }

    if (input.dueDate !== undefined) {
      updateData.dueDate = parseDueDate(input.dueDate);
    }

    if (input.receiptUrl !== undefined) {
      updateData.receiptUrl = input.receiptUrl || null;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes?.trim() || null;
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: updateData,
    });

    return this.formatLoanResponse(updated);
  }

  /**
   * Mark a pending loan as repaid with duplicate repayment rejection
   */
  static async markAsRepaid(userId: string, loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    if (loan.userId !== userId) {
      throw new AppError('Access denied: You do not have permission to modify this loan record', 403);
    }

    if (loan.status === 'REPAID') {
      throw new AppError('Invalid operation: This loan has already been marked as repaid', 400);
    }

    const updated = await prisma.loan.update({
      where: { id: loanId },
      data: { status: 'REPAID' },
    });

    return this.formatLoanResponse(updated);
  }

  /**
   * Delete a loan record with ownership enforcement
   */
  static async deleteLoan(userId: string, loanId: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new AppError('Loan not found', 404);
    }

    if (loan.userId !== userId) {
      throw new AppError('Access denied: You do not have permission to delete this loan record', 403);
    }

    await prisma.loan.delete({
      where: { id: loanId },
    });

    return {
      message: 'Loan deleted successfully',
      id: loanId,
    };
  }

  /**
   * Calculate dynamic financial dashboard summary directly from PostgreSQL
   * - Total Lent: sum of original amounts of all loans
   * - Total Repaid: sum of amounts of loans marked REPAID
   * - Overdue Amount: sum of amounts of pending loans whose due date is before current calendar date
   */
  static async getSummary(userId: string): Promise<LoanSummaryDto> {
    const startOfToday = getStartOfTodayUTC();

    // 1. Total Lent (all loans belonging to user)
    const totalLentAgg = await prisma.loan.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true,
    });

    // 2. Total Repaid (loans marked REPAID)
    const totalRepaidAgg = await prisma.loan.aggregate({
      where: { userId, status: 'REPAID' },
      _sum: { amount: true },
      _count: true,
    });

    // 3. Overdue Amount (pending loans whose dueDate < startOfToday)
    const overdueAgg = await prisma.loan.aggregate({
      where: {
        userId,
        status: 'PENDING',
        dueDate: { lt: startOfToday },
      },
      _sum: { amount: true },
      _count: true,
    });

    // 4. Pending Loans count
    const pendingCount = await prisma.loan.count({
      where: { userId, status: 'PENDING' },
    });

    const totalLent = totalLentAgg._sum.amount?.toNumber() ?? 0;
    const totalRepaid = totalRepaidAgg._sum.amount?.toNumber() ?? 0;
    const overdueAmount = overdueAgg._sum.amount?.toNumber() ?? 0;

    return {
      totalLent,
      totalLentFormatted: formatINR(totalLent),
      totalRepaid,
      totalRepaidFormatted: formatINR(totalRepaid),
      overdueAmount,
      overdueAmountFormatted: formatINR(overdueAmount),
      totalLoansCount: totalLentAgg._count,
      pendingCount,
      repaidCount: totalRepaidAgg._count,
      overdueCount: overdueAgg._count,
    };
  }
}
