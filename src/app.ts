import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import 'express-async-errors';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import chatRoutes from './routes/chat.routes';
import policyIndexRoutes from './routes/policy-index.routes';
import qdrantRoutes from './routes/qdrant.routes';

const parseAllowedOrigins = (): string[] => {
  const fromEnv =
    process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];

  const defaults = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://the-british-vanity.incitertech.com',
  ].filter(Boolean) as string[];

  return [...new Set([...fromEnv, ...defaults])];
};

const allowedOrigins = parseAllowedOrigins();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api/chat', chatRoutes);
app.use('/api/qdrant', qdrantRoutes);
app.use('/api/index', policyIndexRoutes);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'the-british-vanity-chatbot',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/config', (_req, res) => {
  res.json({
    status: 'ok',
    configured: {
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      mongo: Boolean(process.env.MONGO_URI || process.env.MONGODB_URI),
      mongoConnected: mongoose.connection.readyState === 1,
      qdrant: Boolean(process.env.QDRANT_URL),
      qdrantApiKey: Boolean(process.env.QDRANT_API_KEY),
      mainBackend: Boolean(process.env.MAIN_BACKEND_URL || process.env.ECOMMERCE_API_URL),
    },
    allowedOrigins,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
