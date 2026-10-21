import { Response, NextFunction } from 'express';
import { LoanService } from '../services/loan.service';
import {
  createLoanSchema,
  updateLoanSchema,
  listLoansQuerySchema,
} from '../validators/loan.validator';
import { AuthenticatedRequest } from '../types';

export class LoanController {
  static async createLoan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = createLoanSchema.parse(req.body);
      const loan = await LoanService.createLoan(req.user!.id, validated);
      res.status(201).json({
        success: true,
        message: 'Loan created successfully',
        data: loan,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLoans(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = listLoansQuerySchema.parse(req.query);
      const loans = await LoanService.getLoans(req.user!.id, validated);
      res.status(200).json({
        success: true,
        data: loans,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLoanById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const loan = await LoanService.getLoanById(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: loan,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateLoan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = updateLoanSchema.parse(req.body);
      const loan = await LoanService.updateLoan(req.user!.id, req.params.id, validated);
      res.status(200).json({
        success: true,
        message: 'Loan updated successfully',
        data: loan,
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRepaid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const loan = await LoanService.markAsRepaid(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Loan marked as repaid successfully',
        data: loan,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteLoan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await LoanService.deleteLoan(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await LoanService.getSummary(req.user!.id);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }
}
