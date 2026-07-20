import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import chatRoutes from './routes/chat.routes';
import policyIndexRoutes from './routes/policy-index.routes';
import qdrantRoutes from './routes/qdrant.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

app.use(notFound);
app.use(errorHandler);

export default app;
