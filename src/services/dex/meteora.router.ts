import { DEXQuote } from '../../types/order.types';
import { mockDexRouter } from './mock-dex.router';

/**
 * Mock Meteora DEX Router (Legacy wrapper)
 * @deprecated Use mockDexRouter.getMeteoraQuote() instead
 */
export async function mockMeteoraRouter(
  amount: number,
  fromToken: string,
  toToken: string
): Promise<DEXQuote> {
  return mockDexRouter.getMeteoraQuote(fromToken, toToken, amount);
}

