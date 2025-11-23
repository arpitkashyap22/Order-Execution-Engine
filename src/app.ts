import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { orderRoutes } from './routes/order.routes';
import { wsGateway } from './websocket/ws.gateway';
import { logger } from './utils/logger';

export async function buildApp() {
  const fastify = Fastify({
    logger: false, // We use our custom logger
  });

  // Register WebSocket support
  await fastify.register(websocket);

  // Register routes
  await fastify.register(orderRoutes);

  // Initialize WebSocket gateway
  wsGateway.initialize(fastify);

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Root endpoint
  fastify.get('/', async (request, reply) => {
    return {
      message: 'Solana DEX Order Router API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        createOrder: 'POST /orders',
        getOrder: 'GET /orders/:orderId',
        getAllOrders: 'GET /orders',
        websocket: 'ws://localhost:3000/ws',
      },
    };
  });

  return fastify;
}

