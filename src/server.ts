import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5001;

const start = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Chatbot backend running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
  });
};

start();
