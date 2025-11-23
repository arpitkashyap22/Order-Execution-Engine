import { FastifyInstance } from 'fastify';
import { orderController } from '../controllers/order.controller';
import { CreateOrderRequest } from '../types/order.types';

export async function orderRoutes(fastify: FastifyInstance) {
  // Create order
  fastify.post<{ Body: CreateOrderRequest }>('/orders', async (request, reply) => {
    await orderController.createOrder(request, reply);
  });

  // Get all orders
  fastify.get('/orders', async (request, reply) => {
    await orderController.getAllOrders(request, reply);
  });

  // Get order by ID
  fastify.get<{ Params: { orderId: string } }>('/orders/:orderId', async (request, reply) => {
    await orderController.getOrder(request, reply);
  });
}

