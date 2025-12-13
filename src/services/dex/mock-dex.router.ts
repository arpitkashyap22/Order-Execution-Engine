import { DEXQuote, Order } from '../../types/order.types';
import { logger } from '../../utils/logger';

/**
 * Utility function to simulate network delay
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate a mock transaction hash
 */
const generateMockTxHash = (): string => {
  return `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
};

/**
 * Get base price for token pair
 * In production, this would fetch from a price oracle
 */
const getBasePrice = (tokenIn: string, tokenOut: string): number => {
  // Mock base prices for common pairs
  const priceMap: Record<string, number> = {
    'SOL-USDC': 100,
    'USDC-SOL': 0.01,
    'SOL-USDT': 100,
    'USDT-SOL': 0.01,
  };

  const key = `${tokenIn}-${tokenOut}`;
  return priceMap[key] || 100; // Default to 100 if pair not found
};

/**
 * Mock DEX Router
 * Simulates DEX operations with realistic delays and price variance
 */
export class MockDexRouter {
  /**
   * Get quote from Raydium DEX
   * Simulates network delay and returns price with variance
   */
  async getRaydiumQuote(
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<DEXQuote> {
    logger.debug(`Fetching Raydium quote for ${amount} ${tokenIn} → ${tokenOut}`);

    // Simulate network delay (200ms average)
    await sleep(200);

    const basePrice = getBasePrice(tokenIn, tokenOut);
    const fee = 0.003; // 0.3% fee

    // Return price with variance: basePrice * (0.98 + random * 0.04)
    // This gives prices between 98% and 102% of base price
    const price = basePrice * (0.98 + Math.random() * 0.04);
    const output = amount * price * (1 - fee);
    const feeAmount = amount * price * fee;

    logger.debug(`Raydium quote: ${output} ${tokenOut} (price: ${price}, fee: ${feeAmount})`);

    return {
      dex: 'raydium',
      output,
      price,
      fee: feeAmount,
    };
  }

  /**
   * Get quote from Meteora DEX
   * Simulates network delay and returns price with variance
   */
  async getMeteoraQuote(
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<DEXQuote> {
    logger.debug(`Fetching Meteora quote for ${amount} ${tokenIn} → ${tokenOut}`);

    // Simulate network delay (200ms average)
    await sleep(200);

    const basePrice = getBasePrice(tokenIn, tokenOut);
    const fee = 0.002; // 0.2% fee (lower than Raydium)

    // Return price with variance: basePrice * (0.97 + random * 0.05)
    // This gives prices between 97% and 102% of base price
    const price = basePrice * (0.97 + Math.random() * 0.05);
    const output = amount * price * (1 - fee);
    const feeAmount = amount * price * fee;

    logger.debug(`Meteora quote: ${output} ${tokenOut} (price: ${price}, fee: ${feeAmount})`);

    return {
      dex: 'meteora',
      output,
      price,
      fee: feeAmount,
    };
  }

  /**
   * Execute swap on selected DEX
   * Simulates 2-3 second execution time
   */
  async executeSwap(dex: string, order: Order): Promise<{ txHash: string; executedPrice: number }> {
    logger.info(`Executing swap on ${dex} for order ${order.orderId}`);

    // Simulate 2-3 second execution time
    const executionTime = 2000 + Math.random() * 1000;
    await sleep(executionTime);

    const txHash = generateMockTxHash();
    const executedPrice = order.outputAmount || order.amount * 100; // Use output amount or fallback

    logger.info(`Swap executed on ${dex}: ${txHash} at price ${executedPrice}`);

    return {
      txHash,
      executedPrice,
    };
  }
}

// Export singleton instance
export const mockDexRouter = new MockDexRouter();

