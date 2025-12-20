import { v4 as uuidv4 } from 'uuid';
import { Order, CreateOrderRequest, OrderStatus } from '../types/order.types';
import { getDatabasePool } from '../config/database';
import { logger } from '../utils/logger';

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    const orderId = uuidv4();
    const now = new Date();
    const pool = getDatabasePool();

    const query = `
      INSERT INTO orders (order_id, from_token, to_token, amount, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      orderId,
      request.fromToken,
      request.toToken,
      request.amount,
      'pending',
      now,
      now,
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    const order: Order = {
      orderId: row.order_id,
      fromToken: row.from_token,
      toToken: row.to_token,
      amount: parseFloat(row.amount),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      selectedDex: row.selected_dex || undefined,
      outputAmount: row.output_amount ? parseFloat(row.output_amount) : undefined,
      transactionHash: row.transaction_hash || undefined,
    };

    logger.info(`Order created: ${orderId}`);
    return order;
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const pool = getDatabasePool();

    const query = 'SELECT * FROM orders WHERE order_id = $1';
    const result = await pool.query(query, [orderId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      orderId: row.order_id,
      fromToken: row.from_token,
      toToken: row.to_token,
      amount: parseFloat(row.amount),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      selectedDex: row.selected_dex || undefined,
      outputAmount: row.output_amount ? parseFloat(row.output_amount) : undefined,
      transactionHash: row.transaction_hash || undefined,
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updates?: Partial<Order>
  ): Promise<Order | null> {
    const pool = getDatabasePool();

    // Build update query dynamically based on provided updates
    const updateFields: string[] = ['status = $1'];
    const values: any[] = [status];

    if (updates?.selectedDex !== undefined) {
      updateFields.push(`selected_dex = $${values.length + 1}`);
      values.push(updates.selectedDex);
    }

    if (updates?.outputAmount !== undefined) {
      updateFields.push(`output_amount = $${values.length + 1}`);
      values.push(updates.outputAmount);
    }

    if (updates?.transactionHash !== undefined) {
      updateFields.push(`transaction_hash = $${values.length + 1}`);
      values.push(updates.transactionHash);
    }

    values.push(orderId); // order_id for WHERE clause

    const query = `
      UPDATE orders
      SET ${updateFields.join(', ')}
      WHERE order_id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      logger.warn(`Order not found: ${orderId}`);
      return null;
    }

    const row = result.rows[0];
    const updatedOrder: Order = {
      orderId: row.order_id,
      fromToken: row.from_token,
      toToken: row.to_token,
      amount: parseFloat(row.amount),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      selectedDex: row.selected_dex || undefined,
      outputAmount: row.output_amount ? parseFloat(row.output_amount) : undefined,
      transactionHash: row.transaction_hash || undefined,
    };

    logger.info(`Order ${orderId} status updated to: ${status}`);
    return updatedOrder;
  }

  /**
   * Get all orders (for debugging/testing)
   */
  async getAllOrders(): Promise<Order[]> {
    const pool = getDatabasePool();

    const query = 'SELECT * FROM orders ORDER BY created_at DESC';
    const result = await pool.query(query);

    return result.rows.map((row: any) => ({
      orderId: row.order_id,
      fromToken: row.from_token,
      toToken: row.to_token,
      amount: parseFloat(row.amount),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      selectedDex: row.selected_dex || undefined,
      outputAmount: row.output_amount ? parseFloat(row.output_amount) : undefined,
      transactionHash: row.transaction_hash || undefined,
    }));
  }
}

export const orderService = new OrderService();
