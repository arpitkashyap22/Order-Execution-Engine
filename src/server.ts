import { buildApp } from './app';
import { getRedisClient, closeRedisConnection } from './config/redis';
import { wsGateway } from './websocket/ws.gateway';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

let app: Awaited<ReturnType<typeof buildApp>>;

async function startServer() {
  try {
    // Initialize Redis connection
    getRedisClient();

    // Build Fastify app
    app = await buildApp();

    // Start server
    await app.listen({ port: PORT, host: HOST });

    logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
    logger.info(`📡 WebSocket server available at ws://${HOST}:${PORT}/ws`);
    logger.info(`✅ Health check: http://${HOST}:${PORT}/health`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  try {
    await wsGateway.close();
    if (app) {
      await app.close();
    }
    await closeRedisConnection();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();

