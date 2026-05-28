import app, { redisClient } from './app.ts';
import logger from './config/logger.ts';
import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { registerRealtimeSocket } from './socket/realtime.socket.ts';
import { env } from './config/env.ts';

const PORT = process.env.PORT || 8000;
let isShuttingDown = false;

redisClient
  .connect()
  .then(() => {
    logger.info('Connected to Redis');
  })
  .catch(err => {
    logger.error(`Failed to connect to Redis: ${String(err)}`);
  });

const httpServer = createServer(app);
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
].filter((origin): origin is string => Boolean(origin));

const io = new SocketServer(httpServer, {
  path: env.WS_PATH || '/ws',
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

registerRealtimeSocket(io);

const server = httpServer.listen(PORT, () => {
  logger.info(`API server listening on ${PORT}`);
});

const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}, shutting down API server`);

  const closeServer = () =>
    new Promise<void>((resolve, reject) => {
      server.close(err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

  try {
    const redisShutdown = redisClient.isOpen ? redisClient.quit() : undefined;
    await Promise.allSettled([closeServer(), redisShutdown]);
    logger.info('API server shut down cleanly');
    process.exit(0);
  } catch (err) {
    logger.error(`Shutdown failed: ${String(err)}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
