// app/api/admin/axg/mint/route.ts
import { NextResponse } from 'next/server';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { ethers } from 'ethers';

const ERC20_MINT_ABI = [
  'function mint(address to, uint256 amount) external',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

function isHexAddress(a: string): a is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

export async function POST(req: Request) {
  try {
    // Same dev-bypass behavior as your PRT route (requireElderServer already honors it)
    await requireElderServer();

    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const pk = process.env.COUNCIL_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const tokenAddr = process.env.AXG_TOKEN_ADDRESS;

    if (!rpcUrl)  return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!pk)      return NextResponse.json({ ok: false, error: 'COUNCIL_SIGNER_PRIVATE_KEY missing' }, { status: 500 });
    if (!tokenAddr || !isHexAddress(tokenAddr)) {
      return NextResponse.json({ ok: false, error: 'AXG_TOKEN_ADDRESS missing/invalid' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const to = String(body?.to || '').trim();
    const amountTokens = Number(body?.amountTokens ?? 1000);

    if (!isHexAddress(to)) {
      return NextResponse.json({ ok: false, error: 'Invalid `to` address' }, { status: 400 });
    }
    if (!Number.isFinite(amountTokens) || amountTokens <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid `amountTokens`' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(pk, provider);
    const token = new ethers.Contract(tokenAddr, ERC20_MINT_ABI, signer);

    const decimals: number = await token.decimals();
    const symbol: string = await token.symbol();
    const amountWei = ethers.parseUnits(String(amountTokens), decimals);

    const tx = await token.mint(to, amountWei);
    const receipt = await tx.wait();

    // Return only JSON-safe primitives
    return NextResponse.json({
      ok: true,
      token: tokenAddr,
      to,
      amountTokens,
      symbol,
      decimals: String(decimals),
      amountWei: amountWei.toString(),
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      txUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
    });
  } catch (e: any) {
    const msg = e?.info?.error?.message || e?.message || 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}