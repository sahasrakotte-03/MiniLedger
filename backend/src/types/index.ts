import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  name?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface LoanSummaryDto {
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
