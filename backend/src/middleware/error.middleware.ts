import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errorMap = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: errorMap[0]?.message || 'Validation error',
      details: errorMap,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum allowed size is 5 MB.'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Unexpected upload field. Please send the image as "receipt".'
          : err.message || 'Receipt upload failed.';

    res.status(400).json({
      success: false,
      error: message,
    });
    return;
  }

  console.error('[Unhandled Server Error]:', err);

  res.status(500).json({
    success: false,
    error: 'An internal server error occurred. Please try again later.',
  });
}
