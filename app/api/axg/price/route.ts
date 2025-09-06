import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- Minimal Chainlink ABI (latestRoundData + decimals + description)
const FEED_ABI = [
  'function decimals() view returns (uint8)',
  'function description() view returns (string)',
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
] as const;

// ---- Simple in-process cache (45s)
type CacheShape = {
  at: number;
  payload: any;
};
let _cache: CacheShape | null = null;
const TTL_MS = 45_000;

function isHexAddress(a?: string | null): a is `0x${string}` {
  return !!a && /^0x[a-fA-F0-9]{40}$/.test(a);
}

function toNumberScaled(x: bigint, decimals: number): number {
  // convert bigint to number with decimals (for display only)
  const s = x.toString();
  if (decimals === 0) return Number(s);

  const neg = s.startsWith('-');
  const digits = neg ? s.slice(1) : s;
  const pad = decimals - digits.length + 1;
  const whole = pad > 0 ? '0' : digits.slice(0, digits.length - decimals);
  const frac = pad > 0 ? `${'0'.repeat(pad)}${digits}` : digits.slice(-decimals);
  const out = `${neg ? '-' : ''}${whole}.${frac}`.replace(/\.?0+$/, '');
  return Number(out);
}

export async function GET() {
  try {
    const now = Date.now();
    if (_cache && now - _cache.at < TTL_MS) {
      return NextResponse.json(_cache.payload);
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const goldFeed = process.env.GOLD_USD_FEED;
    const ethFeed = process.env.ETH_USD_FEED;

    if (!rpcUrl) return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!isHexAddress(goldFeed)) return NextResponse.json({ ok: false, error: 'GOLD_USD_FEED missing/invalid' }, { status: 500 });
    if (!isHexAddress(ethFeed))  return NextResponse.json({ ok: false, error: 'ETH_USD_FEED missing/invalid' }, { status: 500 });

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    async function readFeed(addr: string) {
      const c = new ethers.Contract(addr, FEED_ABI, provider);
      const [dec, desc] = await Promise.all([c.decimals() as Promise<number>, c.description() as Promise<string>]);
      const [ , answer, , updatedAt ] =
        (await c.latestRoundData()) as unknown as [bigint, bigint, bigint, bigint, bigint];
      const value = toNumberScaled(answer, Number(dec));
      return {
        address: addr,
        desc,
        decimals: Number(dec),
        answer: answer.toString(),
        value, // number, scaled by decimals
        updatedAt: Number(updatedAt),
        updatedAtISO: new Date(Number(updatedAt) * 1000).toISOString(),
      };
    }

    const [gold, eth] = await Promise.all([readFeed(goldFeed), readFeed(ethFeed)]);

    const payload = {
      ok: true,
      source: 'chainlink',
      prices: {
        goldUsd: gold.value,
        ethUsd: eth.value,
      },
      gold,
      eth,
      fetchedAt: new Date().toISOString(),
      ttlMs: TTL_MS,
    };

    _cache = { at: now, payload };
    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}