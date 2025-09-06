import { NextResponse } from 'next/server';
import { getLatestUsdPrice } from '@/lib/chain/contracts';
import { getUniswapV3TwapUSD } from '@/lib/chain/prices/uniswapV3';

export async function GET() {
  try {
    // 1) If a dedicated Chainlink feed for PRT/USD exists, you could read it here instead.
    //    For now, we try Uniswap v3 TWAP first if pool env exists:
    if (process.env.UNIV3_PRT_USD_POOL && process.env.PRT_TOKEN_ADDRESS && process.env.USD_TOKEN_ADDRESS) {
      const twap = await getUniswapV3TwapUSD();
      if (twap.ok) return NextResponse.json(twap);
      // fall through (log but don’t fail)
      // eslint-disable-next-line no-console
      console.warn('[prt-price] Uniswap TWAP fallback error:', twap);
    }

    // 2) If you add a Chainlink aggregator for PRT/USD later, wire it here.
    //    Example (pseudo):
    // if (process.env.CHAINLINK_PRT_USD_FEED_ADDRESS) {
    //   const res = await getLatestUsdPriceFromFeed(process.env.CHAINLINK_PRT_USD_FEED_ADDRESS);
    //   return NextResponse.json({ ok: true, source: 'chainlink', ...res });
    // }

    // 3) Fallback: env peg (demo)
    const raw = (process.env.NEXT_PUBLIC_PRT_USD_PRICE || '').trim();
    const price = Number.isFinite(Number(raw)) ? Number(raw) : 1;
    const priceStr = price.toFixed(2);

    return NextResponse.json({ ok: true, source: 'env', price, priceStr });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}