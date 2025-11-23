import { DEXQuote } from '../../types/order.types';
import { logger } from '../../utils/logger';

/**
 * Mock Meteora DEX Router
 * Simulates price quotes from Meteora DEX
 */
export async function mockMeteoraRouter(
  amount: number,
  fromToken: string,
  toToken: string
): Promise<DEXQuote> {
  logger.debug(`Fetching Meteora quote for ${amount} ${fromToken} → ${toToken}`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  // Mock price calculation with slightly different parameters than Raydium
  const basePrice = 100.5; // Mock base price (slightly different from Raydium)
  const slippage = 0.0008; // 0.08% slippage (better than Raydium)
  const fee = 0.0025; // 0.25% fee (lower than Raydium)

  const price = basePrice * (1 - slippage);
  const output = amount * price * (1 - fee);
  const feeAmount = amount * price * fee;

  logger.debug(`Meteora quote: ${output} ${toToken} (fee: ${feeAmount})`);

  return {
    dex: 'meteora',
    output,
    price,
    fee: feeAmount,
  };
}

