/*
 * index.ts
 * Express application bootstrap — configures security middleware (Helmet, CORS),
 * rate limiting, compression, request logging, mounts all API route groups,
 * and starts the HTTP server after verifying the database connection.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { connectDatabase } from './utils/prisma';
import { errorHandler, notFound } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import submissionRoutes from './routes/submission.routes';
import adminRoutes from './routes/admin.routes';
import mcaRoutes from './routes/mca.routes';

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Allow server-to-server requests (no Origin header)
      if (config.nodeEnv === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return cb(null, true); // Accept any localhost port in development
      }
      if (origin === config.clientUrl) return cb(null, true);
      cb(new Error('CORS: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter cap for auth endpoints to deter brute force
  message: { success: false, message: 'Too many authentication attempts.' },
});

app.use(limiter);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } })); // Pipe Morgan HTTP logs into Winston
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Corporate Compliance Portal API — DEMO', version: '1.0.0' });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes); // Auth routes get the tighter rate limiter
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mca', mcaRoutes);

// Static uploads (for dev only)
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDatabase();
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} [${config.nodeEnv}]`);
    logger.info(`Client URL: ${config.clientUrl}`);
  });
}

bootstrap();

export default app;
