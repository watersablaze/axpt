import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AGG_ABI = [
  'function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)',
  'function decimals() view returns (uint8)',
  'function description() view returns (string)',
] as const;

const safeJson = (o: any) =>
  JSON.parse(JSON.stringify(o, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

function isAddr(a?: string | null): a is `0x${string}` {
  return !!a && /^0x[a-fA-F0-9]{40}$/.test(a);
}

type FeedOut = {
  address: `0x${string}`;
  desc: string;
  value: number;
  updatedAt: string;
};

// --- simple in-memory cache (per server instance) ---
let _cache:
  | {
      ts: number;
      data: { ok: true; gold: FeedOut; eth: FeedOut; source: 'chainlink' };
    }
  | null = null;

const TTL_MS = 45_000;

async function readFeed(
  provider: ethers.JsonRpcProvider,
  addr: `0x${string}`,
  labelFallback: string
): Promise<FeedOut> {
  const c = new ethers.Contract(addr, AGG_ABI, provider);

  // Cast everything from ethers v6 as bigint
  const [ , answer, , updatedAt ] =
    (await c.latestRoundData()) as unknown as [bigint, bigint, bigint, bigint, bigint];

  const dec: number = await c.decimals().catch(() => 8);
  const desc: string = await c.description().catch(() => labelFallback);

  if (answer <= 0n) throw new Error(`${labelFallback} returned non-positive`);
  const value = Number(answer) / 10 ** dec;

  return {
    address: addr,
    desc,
    value,
    updatedAt: new Date(Number(updatedAt) * 1000).toISOString(),
  };
}

export async function GET() {
  try {
    // Serve from cache if fresh
    if (_cache && Date.now() - _cache.ts < TTL_MS) {
      return NextResponse.json(_cache.data);
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const goldFeed = process.env.GOLD_USD_FEED;
    const ethFeed  = process.env.ETH_USD_FEED;

    if (!rpcUrl)  return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!isAddr(goldFeed) || !isAddr(ethFeed)) {
      return NextResponse.json({ ok: false, error: 'GOLD_USD_FEED / ETH_USD_FEED missing/invalid' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const [gold, eth] = await Promise.all([
      readFeed(provider, goldFeed as `0x${string}`, 'Gold / USD'),
      readFeed(provider, ethFeed  as `0x${string}`, 'ETH / USD'),
    ]);

    const payload = { ok: true as const, gold, eth, source: 'chainlink' as const };
    _cache = { ts: Date.now(), data: payload };
    return NextResponse.json(safeJson(payload));
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}