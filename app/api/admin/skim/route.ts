import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ABI = [
  'function excessCollateralWei() view returns (uint256)',
  'function skimExcess(address to, uint256 maxAmount) external',
] as const;

function isHexAddress(a: string): a is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}
const safeJson = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

export async function POST(req: Request) {
  try {
    await requireElderServer();

    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const pk     = process.env.COUNCIL_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const axg    = process.env.AXG_TOKEN_ADDRESS;

    if (!rpcUrl) return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!pk)     return NextResponse.json({ ok: false, error: 'COUNCIL_SIGNER_PRIVATE_KEY missing' }, { status: 500 });
    if (!axg || !isHexAddress(axg)) {
      return NextResponse.json({ ok: false, error: 'AXG_TOKEN_ADDRESS missing/invalid' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const to = String(body?.to || '').trim();
    const maxAmountWeiStr = String(body?.maxAmountWei || '').trim(); // optional
    if (!isHexAddress(to)) return NextResponse.json({ ok: false, error: 'Invalid `to`' }, { status: 400 });

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer   = new ethers.Wallet(pk, provider);
    const c        = new ethers.Contract(axg, ABI, signer);

    const excess: bigint = await c.excessCollateralWei();
    let maxAmt: bigint;
    if (!maxAmountWeiStr) {
      maxAmt = excess; // skim all
    } else {
      if (!/^\d+$/.test(maxAmountWeiStr)) return NextResponse.json({ ok: false, error: 'maxAmountWei must be integer' }, { status: 400 });
      maxAmt = BigInt(maxAmountWeiStr);
      if (maxAmt > excess) maxAmt = excess;
    }
    if (excess === 0n || maxAmt === 0n) {
      return NextResponse.json({ ok: false, error: 'No excess to skim' }, { status: 400 });
    }

    const tx = await c.skimExcess(to, maxAmt);
    const receipt = await tx.wait();

    return NextResponse.json(safeJson({
      ok: true,
      axg,
      to,
      requested: maxAmountWeiStr || 'all',
      skimmedWei: maxAmt,
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      txUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
    }));
  } catch (e: any) {
    const msg = e?.info?.error?.message || e?.message || 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}