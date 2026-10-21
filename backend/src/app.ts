import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loan.routes';
import uploadRoutes from './routes/upload.routes';
import { errorHandler } from './middleware/error.middleware';

export function createApp(): Application {
  const app = express();

  // Cross-Origin Resource Sharing
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for uploaded receipt images
  const uploadDir = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadDir));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'MiniLedger Backend API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Base API route
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'MiniLedger API',
      version: '1.0.0',
      description: 'Production-quality backend for tracking money lent to friends',
      docs: '/api/health',
    });
  });

  // Mount Feature Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/upload', uploadRoutes);

  // 404 Handler for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();
