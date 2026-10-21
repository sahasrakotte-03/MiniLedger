export type LoanStatus = 'PENDING' | 'REPAID';

export interface User {
  id: string;
  phoneNumber: string;
  name?: string | null;
  createdAt?: string;
}

export interface Loan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  amountFormatted: string;
  dueDate: string;
  dueDateFormatted: string;
  status: LoanStatus;
  isOverdue: boolean;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanSummary {
  totalLent: number;
  totalLentFormatted: string;
  totalRepaid: number;
  totalRepaidFormatted: string;
  overdueAmount: number;
  overdueAmountFormatted: string;
  totalLoansCount: number;
  pendingCount: number;
  repaidCount: number;
  overdueCount: number;
}

export type LoanFilter = 'ALL' | 'PENDING' | 'REPAID' | 'OVERDUE';
export type LoanSortField = 'dueDate' | 'amount' | 'friendName' | 'createdAt';
export type LoanSortOrder = 'asc' | 'desc';
