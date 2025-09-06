// app/api/protium/mint/route.ts
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireElderApi } from '@/lib/auth/requireElderApi';
import protiumTokenAbi from '@/lib/chain/abis/protiumToken.json';

function assertEnv(name: string, v?: string) {
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

export async function POST(req: Request) {
  try {
    await requireElderApi();

    const body = await req.json().catch(() => ({}));
    const to = (body?.to as string | undefined)?.trim()
      || process.env.NEXT_PUBLIC_TEST_ACCOUNT
      || '';
    const amountTokens = Number(body?.amountTokens ?? 1000);

    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return NextResponse.json({ ok: false, error: 'Invalid `to` address' }, { status: 400 });
    }
    if (!Number.isFinite(amountTokens) || amountTokens <= 0) {
      return NextResponse.json({ ok: false, error: 'Invalid `amountTokens`' }, { status: 400 });
    }

    const pk = assertEnv('COUNCIL_SIGNER_PRIVATE_KEY', process.env.COUNCIL_SIGNER_PRIVATE_KEY);
    const rpc = assertEnv('SEPOLIA_RPC_URL', process.env.SEPOLIA_RPC_URL);
    const tokenAddr = assertEnv('PROTIUM_TOKEN_ADDRESS', process.env.PROTIUM_TOKEN_ADDRESS);

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const token = new ethers.Contract(tokenAddr, protiumTokenAbi, wallet);

    const decimals: number = await token.decimals();
    const amountWei = ethers.parseUnits(String(amountTokens), decimals);

    const tx = await token.mint(to, amountWei);
    const receipt = await tx.wait();

    return NextResponse.json({
      ok: true,
      hash: tx.hash,
      to,
      amountTokens,
      blockNumber: receipt?.blockNumber ?? null,
    });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status });
  }
}