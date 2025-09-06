import { ethers } from 'ethers';
import poolAbi from '../abis/uniswapV3Pool.json';
import { getProvider } from '../contracts';

/**
 * Compute the time-weighted average tick over the last N seconds and convert to a price.
 * This returns the price for 1 unit of `base` in terms of `quote`.
 *
 * ENV you will likely set:
 * - UNIV3_PRT_USD_POOL      = 0x... (the PRT/USDC or PRT/DAI pool)
 * - PRT_TOKEN_ADDRESS       = 0x...
 * - USD_TOKEN_ADDRESS       = 0x... (USDC or DAI on your network)
 * - TWAP_SECONDS            = 900   (15m default)
 */

type Tokens = {
  base: { address: `0x${string}`; decimals: number };   // PRT
  quote: { address: `0x${string}`; decimals: number };  // USD token (USDC/DAI)
};

function isAddress(a: string | undefined | null): a is `0x${string}` {
  return !!a && /^0x[0-9a-fA-F]{40}$/.test(a);
}

function pow1p0001(n: number): number {
  // 1.0001^n — JS-safe implementation
  return Math.pow(1.0001, n);
}

function tickToPrice(tick: number, token0Decimals: number, token1Decimals: number, baseIsToken0: boolean): number {
  // Price token1 per token0 at given tick = 1.0001^tick
  const ratio = pow1p0001(tick);
  // Adjust for decimals (token0 vs token1)
  // If base == token0: price(quote per base) = ratio * 10^(dec0 - dec1)
  // If base == token1: price(quote per base) = (1/ratio) * 10^(dec1 - dec0)
  const decAdj = Math.pow(10, token0Decimals - token1Decimals);
  const priceToken1PerToken0 = ratio * decAdj;

  if (baseIsToken0) {
    return priceToken1PerToken0; // quote per base
  } else {
    return 1 / priceToken1PerToken0; // quote per base (since base is token1)
  }
}

export async function getUniswapV3TwapUSD(opts?: {
  pool?: `0x${string}`;
  tokens?: Tokens;
  twapSeconds?: number;
}): Promise<{ ok: true; price: number; priceStr: string; source: 'uniswap-v3-twap'; meta: any } | { ok: false; error: string }> {
  try {
    const provider = getProvider();

    const pool = (opts?.pool || process.env.UNIV3_PRT_USD_POOL || '').trim();
    if (!isAddress(pool)) {
      return { ok: false, error: 'UNIV3_PRT_USD_POOL not set or invalid' };
    }

    const baseAddr = (opts?.tokens?.base.address || process.env.PRT_TOKEN_ADDRESS || '').trim();
    const quoteAddr = (opts?.tokens?.quote.address || process.env.USD_TOKEN_ADDRESS || '').trim();
    if (!isAddress(baseAddr) || !isAddress(quoteAddr)) {
      return { ok: false, error: 'PRT_TOKEN_ADDRESS or USD_TOKEN_ADDRESS missing/invalid' };
    }

    // Decimals: allow env overrides, otherwise default common values
    const baseDecimals = Number(process.env.PRT_TOKEN_DECIMALS || (opts?.tokens?.base.decimals ?? 18));
    const quoteDecimals = Number(process.env.USD_TOKEN_DECIMALS || (opts?.tokens?.quote.decimals ?? 6));

    const twapSeconds = Number(process.env.TWAP_SECONDS || opts?.twapSeconds || 900); // 15m default

    const poolC = new ethers.Contract(pool, poolAbi, provider);

    const [t0, t1] = await Promise.all([
      poolC.token0() as Promise<string>,
      poolC.token1() as Promise<string>,
    ]);
    const token0 = (t0 as string).toLowerCase();
    const token1 = (t1 as string).toLowerCase();

    const baseLower = baseAddr.toLowerCase();
    const quoteLower = quoteAddr.toLowerCase();

    if (!((token0 === baseLower && token1 === quoteLower) || (token0 === quoteLower && token1 === baseLower))) {
      return { ok: false, error: 'Pool tokens do not match base/quote addresses provided' };
    }

    // Oracle observe for TWAP
    const secondsAgos = [twapSeconds, 0];
    const { 0: tickCumuls } = await poolC.observe(secondsAgos);
    // tickCumuls: int56[]
    const tickCumulStart = Number(tickCumuls[0]);
    const tickCumulEnd = Number(tickCumuls[1]);
    const avgTick = Math.floor((tickCumulEnd - tickCumulStart) / twapSeconds);

    const baseIsToken0 = token0 === baseLower;
    const price = tickToPrice(avgTick, baseIsToken0 ? baseDecimals : quoteDecimals, baseIsToken0 ? quoteDecimals : baseDecimals, baseIsToken0);

    const priceStr = price.toFixed(6); // show more precision on backend; frontend can format

    return {
      ok: true,
      price,
      priceStr,
      source: 'uniswap-v3-twap',
      meta: {
        pool,
        twapSeconds,
        avgTick,
        base: { address: baseAddr, decimals: baseDecimals },
        quote: { address: quoteAddr, decimals: quoteDecimals },
        token0, token1
      }
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'UniswapV3 TWAP error' };
  }
}