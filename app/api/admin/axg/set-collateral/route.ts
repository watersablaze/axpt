import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ABI = [
  'function setCollateralRatioBps(uint16 newBps) external',
  'function symbol() view returns (string)',
] as const;

const safeJson = (o: any) =>
  JSON.parse(JSON.stringify(o, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

function isAddr(a?: string | null): a is `0x${string}` {
  return !!a && /^0x[a-fA-F0-9]{40}$/.test(a);
}

export async function POST(req: Request) {
  try {
    // Allow dev-bypass for cURL without cookies
    const devBypass = req.headers.get('x-dev-bypass') === '1';
    if (!devBypass) {
      await requireElderServer();
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const pk = process.env.COUNCIL_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const axg = process.env.AXG_TOKEN_ADDRESS;

    if (!rpcUrl)  return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!pk)      return NextResponse.json({ ok: false, error: 'COUNCIL_SIGNER_PRIVATE_KEY missing' }, { status: 500 });
    if (!isAddr(axg)) return NextResponse.json({ ok: false, error: 'AXG_TOKEN_ADDRESS missing/invalid' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const bps = Number(body?.bps);
    if (!Number.isInteger(bps) || bps < 1000 || bps > 5000) {
      return NextResponse.json({ ok: false, error: 'bps must be 1000..5000' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(pk, provider);
    const token = new ethers.Contract(axg, ABI, signer);

    // (Optional) just to echo nicer UX
    let symbol = 'AXG';
    try { symbol = await token.symbol(); } catch {}

    const tx = await token.setCollateralRatioBps(bps);
    const receipt = await tx.wait();

    return NextResponse.json(
      safeJson({
        ok: true,
        symbol,
        bps,
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber ?? null,
        txUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
      })
    );
  } catch (e: any) {
    const msg =
      e?.info?.error?.message ||
      e?.shortMessage ||
      e?.message ||
      'Call reverted (does AXG implement setCollateralRatioBps?)';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}