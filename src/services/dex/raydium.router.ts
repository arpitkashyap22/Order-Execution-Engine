import { DEXQuote } from '../../types/order.types';
import { mockDexRouter } from './mock-dex.router';

/**
 * Mock Raydium DEX Router (Legacy wrapper)
 * @deprecated Use mockDexRouter.getRaydiumQuote() instead
 */
export async function mockRaydiumRouter(
  amount: number,
  fromToken: string,
  toToken: string
): Promise<DEXQuote> {
  return mockDexRouter.getRaydiumQuote(fromToken, toToken, amount);
}

