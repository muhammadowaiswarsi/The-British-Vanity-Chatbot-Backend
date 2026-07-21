import { Request, Response, NextFunction } from 'express';
import { connectDB } from '../config/db';

/**
 * Ensures MongoDB is connected before handling API requests.
 * Required on Vercel serverless where server.ts / connectDB() is not run at startup.
 */
export const ensureDb = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      'Database connection failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    res.status(503).json({
      success: false,
      message: 'Database connection unavailable.',
    });
  }
};
