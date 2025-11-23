import { FastifyInstance } from 'fastify';
import { getRedisClient } from '../config/redis';
import { OrderProgress, OrderStatus } from '../types/order.types';
import { logger } from '../utils/logger';
import WebSocket from 'ws';

class WebSocketGateway {
  private fastify: FastifyInstance | null = null;
  private clients: Set<WebSocket> = new Set();
  private redisSubscriber: ReturnType<typeof getRedisClient> | null = null;

  /**
   * Initialize WebSocket gateway
   */
  initialize(fastify: FastifyInstance): void {
    this.fastify = fastify;
    const gateway = this;

    fastify.register(async function (fastify: FastifyInstance) {
      fastify.get('/ws', { websocket: true }, (connection, req) => {
        const ws = connection as unknown as WebSocket;
        gateway.clients.add(ws);
        logger.info(`WebSocket client connected. Total clients: ${gateway.clients.size}`);

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: 'connected',
            message: 'WebSocket connected. You will receive order updates.',
          })
        );

        ws.on('close', () => {
          gateway.clients.delete(ws);
          logger.info(`WebSocket client disconnected. Total clients: ${gateway.clients.size}`);
        });

        ws.on('error', (error: Error) => {
          logger.error('WebSocket error:', error);
          gateway.clients.delete(ws);
        });
      });
    });

    // Subscribe to Redis pub/sub for order updates
    this.subscribeToRedisEvents();
  }

  /**
   * Subscribe to Redis pub/sub events for order updates
   */
  private subscribeToRedisEvents(): void {
    this.redisSubscriber = getRedisClient().duplicate();
    
    this.redisSubscriber.subscribe('order-updates', (err: Error | null | undefined, result: unknown) => {
      if (err) {
        logger.error('Failed to subscribe to order-updates channel:', err);
      } else {
        logger.info('Subscribed to order-updates Redis channel');
      }
    });

    this.redisSubscriber.on('message', (channel: string, message: string) => {
      if (channel === 'order-updates') {
        try {
          const progressUpdate: OrderProgress = JSON.parse(message);
          this.broadcast(progressUpdate);
          logger.debug(`Broadcasting update for order ${progressUpdate.orderId}: ${progressUpdate.status}`);
        } catch (error) {
          logger.error('Error parsing order update message:', error);
        }
      }
    });

    this.redisSubscriber.on('error', (error: Error) => {
      logger.error('Redis subscriber error:', error);
    });
  }

  /**
   * Map progress percentage to order status
   */
  private getStatusFromProgress(progress: number | object): OrderStatus {
    if (typeof progress !== 'number') {
      return 'pending';
    }

    if (progress < 20) {
      return 'pending';
    } else if (progress < 40) {
      return 'routing';
    } else if (progress < 60) {
      return 'building';
    } else if (progress < 100) {
      return 'submitted';
    } else {
      return 'confirmed';
    }
  }

  /**
   * Get status message
   */
  private getStatusMessage(status: OrderStatus): string {
    const messages: Record<OrderStatus, string> = {
      pending: 'Order is pending',
      routing: 'Finding best DEX route...',
      building: 'Building transaction...',
      submitted: 'Transaction submitted to blockchain',
      confirmed: 'Transaction confirmed',
    };

    return messages[status];
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: OrderProgress): void {
    const data = JSON.stringify({
      type: 'order-update',
      ...message,
    });

    this.clients.forEach((client) => {
      try {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(data);
        } else {
          // Remove closed connections
          this.clients.delete(client);
        }
      } catch (error) {
        logger.error('Error broadcasting to client:', error);
        this.clients.delete(client);
      }
    });
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Cleanup and close connections
   */
  async close(): Promise<void> {
    if (this.redisSubscriber) {
      await this.redisSubscriber.unsubscribe();
      await this.redisSubscriber.quit();
      this.redisSubscriber = null;
      logger.info('Redis subscriber closed');
    }
  }
}

export const wsGateway = new WebSocketGateway();

