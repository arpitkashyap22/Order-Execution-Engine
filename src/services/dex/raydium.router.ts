import { DEXQuote } from '../../types/order.types';
import { logger } from '../../utils/logger';

/**
 * Mock Raydium DEX Router
 * Simulates price quotes from Raydium DEX
 */
export async function mockRaydiumRouter(
  amount: number,
  fromToken: string,
  toToken: string
): Promise<DEXQuote> {
  logger.debug(`Fetching Raydium quote for ${amount} ${fromToken} → ${toToken}`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  // Mock price calculation
  // In a real scenario, this would fetch actual liquidity pool data
  const basePrice = 100; // Mock base price (e.g., 1 SOL = 100 USDC)
  const slippage = 0.001; // 0.1% slippage
  const fee = 0.003; // 0.3% fee

  const price = basePrice * (1 - slippage);
  const output = amount * price * (1 - fee);
  const feeAmount = amount * price * fee;

  logger.debug(`Raydium quote: ${output} ${toToken} (fee: ${feeAmount})`);

  return {
    dex: 'raydium',
    output,
    price,
    fee: feeAmount,
  };
}

