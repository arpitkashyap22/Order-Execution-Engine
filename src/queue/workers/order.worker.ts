import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../../config/redis';
import { getDatabasePool, closeDatabasePool, testDatabaseConnection } from '../../config/database';
import { OrderJobData, OrderStatus, OrderProgress } from '../../types/order.types';
import { mockDexRouter } from '../../services/dex/mock-dex.router';
import { logger } from '../../utils/logger';

/**
 * Broadcast order progress update via Redis pub/sub
 */
async function broadcastProgress(progressUpdate: OrderProgress): Promise<void> {
  const redis = getRedisClient();
  try {
    await redis.publish('order-updates', JSON.stringify(progressUpdate));
  } catch (error) {
    logger.error('Error broadcasting progress:', error);
  }
}

/**
 * Get status message
 */
function getStatusMessage(status: OrderStatus): string {
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
 * Update order status in database
 */
async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  updates?: { selectedDex?: string; outputAmount?: number; transactionHash?: string }
): Promise<void> {
  const pool = getDatabasePool();
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

  values.push(orderId);

  const query = `
    UPDATE orders
    SET ${updateFields.join(', ')}
    WHERE order_id = $${values.length}
  `;

  await pool.query(query, values);
}

/**
 * Process order execution job
 */
async function processOrder(job: Job<OrderJobData>): Promise<void> {
  const { orderId, fromToken, toToken, amount } = job.data;

  logger.info(`Processing order ${orderId}: ${amount} ${fromToken} → ${toToken}`);

  try {
    // Stage 1: Routing (20% progress)
    await job.updateProgress(20);
    await updateOrderStatus(orderId, 'routing');
    await broadcastProgress({
      orderId,
      status: 'routing',
      progress: 20,
      message: getStatusMessage('routing'),
    });
    logger.info(`Order ${orderId}: Routing...`);

    // Fetch quotes from both DEXs
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      mockDexRouter.getRaydiumQuote(fromToken, toToken, amount),
      mockDexRouter.getMeteoraQuote(fromToken, toToken, amount),
    ]);

    logger.info(
      `Order ${orderId}: Raydium quote = ${raydiumQuote.output}, Meteora quote = ${meteoraQuote.output}`
    );

    // Choose the best DEX (highest output)
    const bestQuote = meteoraQuote.output > raydiumQuote.output ? meteoraQuote : raydiumQuote;
    logger.info(`Order ${orderId}: Selected ${bestQuote.dex} (output: ${bestQuote.output})`);

    // Stage 2: Building (40% progress)
    await job.updateProgress(40);
    await updateOrderStatus(orderId, 'building', {
      selectedDex: bestQuote.dex,
      outputAmount: bestQuote.output,
    });
    await broadcastProgress({
      orderId,
      status: 'building',
      progress: 40,
      message: getStatusMessage('building'),
      data: {
        selectedDex: bestQuote.dex,
        outputAmount: bestQuote.output,
      },
    });
    logger.info(`Order ${orderId}: Building transaction...`);

    // Reconstruct order object from job data and quote
    // Note: Worker runs in separate process, so we can't access in-memory order store
    const order = {
      orderId,
      fromToken,
      toToken,
      amount,
      status: 'building' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      selectedDex: bestQuote.dex,
      outputAmount: bestQuote.output,
    };

    // Stage 3: Execute swap (60% progress)
    await job.updateProgress(60);
    const swapResult = await mockDexRouter.executeSwap(bestQuote.dex, order);
    
    await updateOrderStatus(orderId, 'submitted', {
      transactionHash: swapResult.txHash,
    });
    await broadcastProgress({
      orderId,
      status: 'submitted',
      progress: 60,
      message: getStatusMessage('submitted'),
      data: {
        transactionHash: swapResult.txHash,
      },
    });
    logger.info(`Order ${orderId}: Transaction submitted: ${swapResult.txHash}`);

    // Stage 4: Confirmed (100% progress)
    await job.updateProgress(100);
    await updateOrderStatus(orderId, 'confirmed');
    await broadcastProgress({
      orderId,
      status: 'confirmed',
      progress: 100,
      message: getStatusMessage('confirmed'),
    });
    logger.info(`Order ${orderId}: Transaction confirmed`);

    logger.info(`Order ${orderId} completed successfully`);
  } catch (error) {
    logger.error(`Order ${orderId} failed:`, error);
    await broadcastProgress({
      orderId,
      status: 'pending',
      progress: 0,
      message: `Order failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    throw error;
  }
}

// Create worker
const orderWorker = new Worker<OrderJobData>(
  'order-execution',
  async (job: Job<OrderJobData>) => {
    await processOrder(job);
  },
  {
    connection: getRedisClient(),
    concurrency: 5, // Process up to 5 orders concurrently
  }
);

orderWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed for order ${job.data.orderId}`);
});

orderWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed for order ${job?.data.orderId}:`, err);
});

orderWorker.on('error', (err) => {
  logger.error('Worker error:', err);
});

// Initialize database connection
getDatabasePool();
testDatabaseConnection().then((connected) => {
  if (!connected) {
    logger.error('Failed to connect to database. Please ensure PostgreSQL is running.');
    process.exit(1);
  }
  logger.info('Order worker started and listening for jobs...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing order worker...');
  await orderWorker.close();
  await closeDatabasePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Closing order worker...');
  await orderWorker.close();
  await closeDatabasePool();
  process.exit(0);
});

