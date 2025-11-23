import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateOrderRequest } from '../types/order.types';
import { orderService } from '../services/order.service';
import { orderQueue } from '../queue/order.queue';
import { logger } from '../utils/logger';

export class OrderController {
  /**
   * Create a new market order
   * POST /orders
   */
  async createOrder(
    request: FastifyRequest<{ Body: CreateOrderRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { fromToken, toToken, amount } = request.body;

      // Validate input
      if (!fromToken || !toToken || !amount || amount <= 0) {
        reply.code(400).send({
          error: 'Invalid request',
          message: 'fromToken, toToken, and amount (positive number) are required',
        });
        return;
      }

      // Create order
      const order = orderService.createOrder({
        fromToken,
        toToken,
        amount,
      });

      // Add job to queue
      await orderQueue.add('execute-order', {
        orderId: order.orderId,
        fromToken,
        toToken,
        amount,
      });

      logger.info(`Order ${order.orderId} queued for execution`);

      reply.code(201).send({
        orderId: order.orderId,
        status: order.status,
        fromToken: order.fromToken,
        toToken: order.toToken,
        amount: order.amount,
      });
    } catch (error) {
      logger.error('Error creating order:', error);
      reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to create order',
      });
    }
  }

  /**
   * Get order by ID
   * GET /orders/:orderId
   */
  async getOrder(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { orderId } = request.params;
      const order = orderService.getOrder(orderId);

      if (!order) {
        reply.code(404).send({
          error: 'Not found',
          message: `Order ${orderId} not found`,
        });
        return;
      }

      reply.send(order);
    } catch (error) {
      logger.error('Error getting order:', error);
      reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to get order',
      });
    }
  }

  /**
   * Get all orders (for debugging)
   * GET /orders
   */
  async getAllOrders(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const orders = orderService.getAllOrders();
      reply.send({
        orders,
        count: orders.length,
      });
    } catch (error) {
      logger.error('Error getting orders:', error);
      reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to get orders',
      });
    }
  }
}

export const orderController = new OrderController();

