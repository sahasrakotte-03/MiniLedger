import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthenticatedRequest, AuthenticatedUser } from '../types';

export function authenticateJwt(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Authorization header. Expected Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      phoneNumber: string;
      name?: string | null;
    };

    req.user = {
      id: decoded.sub,
      phoneNumber: decoded.phoneNumber,
      name: decoded.name,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Session expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token signature or payload.',
    });
  }
}
