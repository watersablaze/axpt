import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ABI = ['function setCollateralRatioBps(uint256) external'];

const safeJson = (o: any) => JSON.parse(JSON.stringify(o, (_, v) => typeof v === 'bigint' ? v.toString() : v));

export async function POST(req: Request) {
  try {
    await requireElderServer();

    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const pk     = process.env.COUNCIL_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const axg    = process.env.AXG_TOKEN_ADDRESS;

    if (!rpcUrl) return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!pk)     return NextResponse.json({ ok: false, error: 'COUNCIL_SIGNER_PRIVATE_KEY missing' }, { status: 500 });
    if (!axg || !/^0x[a-fA-F0-9]{40}$/.test(axg)) {
      return NextResponse.json({ ok: false, error: 'AXG_TOKEN_ADDRESS missing/invalid' }, { status: 500 });
    }

    const { bps } = await req.json().catch(() => ({}));
    const n = Number(bps);
    if (!Number.isInteger(n) || n < 10000 || n > 50000) {
      return NextResponse.json({ ok: false, error: 'bps must be between 10000 and 50000 (100%-500%)' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer   = new ethers.Wallet(pk, provider);
    const c        = new ethers.Contract(axg, ABI, signer);

    const tx = await c.setCollateralRatioBps(n);
    const rc = await tx.wait();
    return NextResponse.json(safeJson({
      ok: true,
      bps: n,
      txHash: tx.hash,
      txUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
      blockNumber: rc?.blockNumber ?? null,
    }));
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}