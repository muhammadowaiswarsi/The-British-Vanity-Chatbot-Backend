import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5001;

const start = async (): Promise<void> => {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY is missing — /api/chat will return 503 until configured.');
  }

  app.listen(PORT, () => {
    console.log(`Chatbot backend running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
  });
};

start();
