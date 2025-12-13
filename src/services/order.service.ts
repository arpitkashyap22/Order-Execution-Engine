import { v4 as uuidv4 } from 'uuid';
import { Order, CreateOrderRequest, OrderStatus } from '../types/order.types';
import { logger } from '../utils/logger';

// In-memory store for orders (in production, use a database)
const ordersStore = new Map<string, Order>();

export class OrderService {
  /**
   * Create a new order
   */
  createOrder(request: CreateOrderRequest): Order {
    const orderId = uuidv4();
    const now = new Date();

    const order: Order = {
      orderId,
      fromToken: request.fromToken,
      toToken: request.toToken,
      amount: request.amount,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    ordersStore.set(orderId, order);
    logger.info(`Order created: ${orderId}`);

    return order;
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Order | undefined {
    return ordersStore.get(orderId);
  }

  /**
   * Update order status
   */
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updates?: Partial<Order>
  ): Order | null {
    const order = this.getOrder(orderId);
    if (!order) {
      logger.warn(`ORDER STORE: ${Array.from(ordersStore.keys())}`);
      logger.warn(`Order not found: ${orderId}`);
      return null;
    }

    const updatedOrder: Order = {
      ...order,
      ...updates,
      status,
      updatedAt: new Date(),
    };

    ordersStore.set(orderId, updatedOrder);
    logger.info(`Order ${orderId} status updated to: ${status}`);

    return updatedOrder;
  }

  /**
   * Get all orders (for debugging/testing)
   */
  getAllOrders(): Order[] {
    return Array.from(ordersStore.values());
  }
}

export const orderService = new OrderService();

