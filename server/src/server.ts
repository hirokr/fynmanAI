import app, { redisClient } from './app.ts';
import logger from './config/logger.ts';

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

const server = app.listen(PORT, () => {
  console.log('start');
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
