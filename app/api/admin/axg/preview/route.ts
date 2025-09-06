import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FEED_ABI = [
  'function decimals() view returns (uint8)',
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
] as const;

function isHexAddress(a?: string | null): a is `0x${string}` {
  return !!a && /^0x[a-fA-F0-9]{40}$/.test(a);
}

// convert bigint price with decimals -> number
function toNumberScaled(x: bigint, decimals: number): number {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ethStr = (searchParams.get('eth') || '').trim();

    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const goldFeed = process.env.GOLD_USD_FEED;
    const ethFeed = process.env.ETH_USD_FEED;

    if (!rpcUrl) return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!isHexAddress(goldFeed)) return NextResponse.json({ ok: false, error: 'GOLD_USD_FEED missing/invalid' }, { status: 500 });
    if (!isHexAddress(ethFeed))  return NextResponse.json({ ok: false, error: 'ETH_USD_FEED missing/invalid' }, { status: 500 });

    const ethAmt = Number(ethStr);
    if (!Number.isFinite(ethAmt) || ethAmt <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid eth amount' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    async function readPrice(addr: string) {
      const c = new ethers.Contract(addr, FEED_ABI, provider);
      const dec = Number(await c.decimals());
      const [ , answer ] =
        (await c.latestRoundData()) as unknown as [bigint, bigint, bigint, bigint, bigint];
      return { dec, answer };
    }

    const [{ dec: goldDec, answer: goldAns }, { dec: ethDec, answer: ethAns }] = await Promise.all([
      readPrice(goldFeed), readPrice(ethFeed),
    ]);

    const goldUsd = toNumberScaled(goldAns, goldDec);
    const ethUsd  = toNumberScaled(ethAns,  ethDec);

    // preview: approx AXG minted if 1 AXG = 1 "unit of gold price feed"
    const expectedAxg = (ethUsd / goldUsd) * ethAmt;
    const minOutAxg = expectedAxg * 0.995; // 0.5% slippage buffer

    return NextResponse.json({
      ok: true,
      inputs: { eth: ethAmt, ethUsd, goldUsd },
      expectedAxg,
      minOutAxg,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}