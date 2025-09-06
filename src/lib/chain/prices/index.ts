import { getUniswapV3TwapUSD } from './uniswapV3';
import { getLatestUsdPrice } from '@/lib/chain/contracts';

/**
 * getPrtUsdPrice() returns a normalized shape:
 *   { ok:true, source:'uniswap-v3-twap'|'chainlink'|'env', price:number, priceStr:string }
 */
export async function getPrtUsdPrice(): Promise<
  | { ok: true; source: 'uniswap-v3-twap' | 'chainlink' | 'env'; price: number; priceStr: string }
  | { ok: false; error: string }
> {
  // 1) Prefer Uniswap v3 TWAP if the pool + token envs are present
  if (process.env.UNIV3_PRT_USD_POOL && process.env.PRT_TOKEN_ADDRESS && process.env.USD_TOKEN_ADDRESS) {
    const twap = await getUniswapV3TwapUSD();
    if (twap.ok) return { ok: true, source: 'uniswap-v3-twap', price: twap.price, priceStr: twap.priceStr };
  }

  // 2) (optional) If you later wire a Chainlink PRT/USD feed, use it here:
  // if (process.env.CHAINLINK_PRT_USD_FEED_ADDRESS) {
  //   const res = await getLatestUsdPriceFromFeed(process.env.CHAINLINK_PRT_USD_FEED_ADDRESS);
  //   return { ok: true, source: 'chainlink', price: res.price, priceStr: res.priceStr };
  // }

  // 3) Fallback: env peg (NEXT_PUBLIC_PRT_USD_PRICE)
  const raw = (process.env.NEXT_PUBLIC_PRT_USD_PRICE || '').trim();
  const price = Number.isFinite(Number(raw)) ? Number(raw) : 1;
  const priceStr = price.toFixed(2);
  return { ok: true, source: 'env', price, priceStr };
}