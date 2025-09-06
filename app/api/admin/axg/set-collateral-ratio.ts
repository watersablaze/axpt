import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ABI = ['function setCollateralRatioBps(uint16) external', 'function collateralRatioBps() view returns (uint16)'] as const;

function isAddr(a?: string | null): a is `0x${string}` {
  return !!a && /^0x[a-fA-F0-9]{40}$/.test(a);
}

export async function POST(req: Request) {
  try {
    // dev bypass allowed like other admin routes
    const bypass = req.headers.get('x-dev-bypass') === '1';
    if (!bypass) await requireElderServer();

    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const pk = process.env.COUNCIL_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const axg = process.env.AXG_TOKEN_ADDRESS;

    if (!rpcUrl) return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!pk) return NextResponse.json({ ok: false, error: 'COUNCIL_SIGNER_PRIVATE_KEY missing' }, { status: 500 });
    if (!isAddr(axg)) return NextResponse.json({ ok: false, error: 'AXG_TOKEN_ADDRESS missing/invalid' }, { status: 500 });

    const { bps } = await req.json().catch(() => ({}));
    const val = Number(bps);
    if (!Number.isInteger(val) || val < 10000 || val > 30000) {
      return NextResponse.json({ ok: false, error: 'bps must be 10000..30000' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(pk, provider);
    const c = new ethers.Contract(axg, ABI, signer);

    const tx = await c.setCollateralRatioBps(val);
    const rc = await tx.wait();

    const current = await c.collateralRatioBps();

    return NextResponse.json({
      ok: true,
      txHash: tx.hash,
      txUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
      collateralRatioBps: Number(current),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}