import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../../config/redis';
import { OrderJobData, OrderStatus, OrderProgress } from '../../types/order.types';
import { mockRaydiumRouter } from '../../services/dex/raydium.router';
import { mockMeteoraRouter } from '../../services/dex/meteora.router';
import { orderService } from '../../services/order.service';
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
 * Process order execution job
 */
async function processOrder(job: Job<OrderJobData>): Promise<void> {
  const { orderId, fromToken, toToken, amount } = job.data;

  logger.info(`Processing order ${orderId}: ${amount} ${fromToken} → ${toToken}`);

  try {
    // Stage 1: Routing (20% progress)
    await job.updateProgress(20);
    orderService.updateOrderStatus(orderId, 'routing');
    await broadcastProgress({
      orderId,
      status: 'routing',
      progress: 20,
      message: getStatusMessage('routing'),
    });
    logger.info(`Order ${orderId}: Routing...`);

    // Fetch quotes from both DEXs
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      mockRaydiumRouter(amount, fromToken, toToken),
      mockMeteoraRouter(amount, fromToken, toToken),
    ]);

    logger.info(
      `Order ${orderId}: Raydium quote = ${raydiumQuote.output}, Meteora quote = ${meteoraQuote.output}`
    );

    // Choose the best DEX (highest output)
    const bestQuote = meteoraQuote.output > raydiumQuote.output ? meteoraQuote : raydiumQuote;
    logger.info(`Order ${orderId}: Selected ${bestQuote.dex} (output: ${bestQuote.output})`);

    // Stage 2: Building (40% progress)
    await job.updateProgress(40);
    orderService.updateOrderStatus(orderId, 'building', {
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

    // Simulate transaction building
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    // Stage 3: Submitted (60% progress)
    await job.updateProgress(60);
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    orderService.updateOrderStatus(orderId, 'submitted', {
      transactionHash: mockTxHash,
    });
    await broadcastProgress({
      orderId,
      status: 'submitted',
      progress: 60,
      message: getStatusMessage('submitted'),
      data: {
        transactionHash: mockTxHash,
      },
    });
    logger.info(`Order ${orderId}: Transaction submitted: ${mockTxHash}`);

    // Simulate blockchain submission
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Stage 4: Confirmed (100% progress)
    await job.updateProgress(100);
    orderService.updateOrderStatus(orderId, 'confirmed');
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
    orderService.updateOrderStatus(orderId, 'pending'); // Reset to pending on error
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

logger.info('Order worker started and listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing order worker...');
  await orderWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Closing order worker...');
  await orderWorker.close();
  process.exit(0);
});

