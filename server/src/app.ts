import express from 'express';
import logger from './config/logger.ts';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import session from 'express-session';
import passport from 'passport';
import { redisClient } from './config/redis-client.ts';

import authRoutes from './routes/auth.route.ts';
import usersRoutes from './routes/user.route.ts';
import resourceRoutes from './routes/resource.route.ts';
import sessionRoutes from './routes/session.route.ts';
import analyticsRoutes from './routes/analytics.route.ts';
import documentParserRoutes from './routes/document-parser.route.ts';
import healthRoutes from './routes/health.route.ts';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';
import {
  createRateLimitMiddleware,
  rateLimitPresets,
} from '#src/middlewares/rate-limit.middleware.ts';

const app = express();
app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://fymenai.vercel.app',
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Store sessions in PostgreSQL via Prisma
app.use(
  session({
    secret: 'cats',
    resave: false,
    saveUninitialized: true,
    // store: new PrismaSessionStore(),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.get('/', (req, res) => {
  logger.info('Hello from Tryora!');

  res.status(200).send('Hello from Tryora!');
});

app.head('/health', (req, res) => {
  sendApiSuccess(res, {
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

app.get('/api', (req, res) => {
  sendApiSuccess(res, { message: 'Tryora API is running!' });
});

app.use('/api/auth', createRateLimitMiddleware(rateLimitPresets.auth));
app.use('/api/parser', createRateLimitMiddleware(rateLimitPresets.upload));
app.use('/api', createRateLimitMiddleware(rateLimitPresets.api));

app.use('/api/auth', authRoutes);
app.use('/api/user', usersRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/parser', documentParserRoutes);

app.use((req, res) => {
  sendApiError(res, { status: 404, message: 'Route not found' });
});

export { redisClient };
export default app;
