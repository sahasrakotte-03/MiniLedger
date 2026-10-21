import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendOtpSchema, verifyOtpSchema } from '../validators/auth.validator';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  static async sendOtp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = sendOtpSchema.parse(req.body);
      const result = await AuthService.sendOtp(validated.phoneNumber);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = verifyOtpSchema.parse(req.body);
      const result = await AuthService.verifyOtp(validated.phoneNumber, validated.otp);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (err) {
      next(err);
    }
  }
}
