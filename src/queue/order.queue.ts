import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { OrderJobData } from '../types/order.types';
import { logger } from '../utils/logger';

export const orderQueue = new Queue<OrderJobData>('order-execution', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

logger.info('Order queue initialized');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing order queue...');
  await orderQueue.close();
});

process.on('SIGINT', async () => {
  logger.info('Closing order queue...');
  await orderQueue.close();
});

