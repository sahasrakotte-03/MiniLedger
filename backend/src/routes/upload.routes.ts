import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJwt } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are permitted.', 400));
    }
  },
});

function receiveReceipt(req: AuthenticatedRequest, res: Response, next: (err?: any) => void) {
  upload.single('receipt')(req, res, (err: any) => {
    if (err) {
      next(err);
      return;
    }
    next();
  });
}

router.post(
  '/receipt',
  authenticateJwt,
  receiveReceipt,
  (req: AuthenticatedRequest, res: Response, next: (err?: any) => void) => {
    try {
      if (!req.file) {
        return next(new AppError('No image file uploaded. Expected multipart field name "receipt".', 400));
      }

      if (!req.file.size) {
        return next(new AppError('Uploaded image was empty. Please choose a valid JPEG or PNG file.', 400));
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.status(200).json({
        success: true,
        message: 'Receipt uploaded successfully',
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
