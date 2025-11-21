import app from './app';
import { environment } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import logger from './utils/logger';

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    const server = app.listen(environment.port, () => {
      logger.info(`Server running on port ${environment.port}`);
      logger.info(`Environment: ${environment.nodeEnv}`);
      logger.info(`Health check: http://localhost:${environment.port}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forcing shutdown...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
