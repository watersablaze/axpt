// app/api/axg/balance/route.ts
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isHexAddress(a: string): a is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

function readAxgUsdFromEnv() {
  // Defaults to 1.00 if unset/invalid; adjust if you want a different default.
  const raw = process.env.NEXT_PUBLIC_AXG_USD_PRICE || process.env.AXG_USD_PRICE;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    return { ok: true as const, price: 1, priceStr: '1.00', source: 'env-default' as const };
  }
  return { ok: true as const, price: num, priceStr: num.toFixed(2), source: 'env' as const };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const account = (searchParams.get('account') || '').trim();
    const withUSD = (searchParams.get('withUSD') || '0') === '1';

    if (!isHexAddress(account)) {
      return NextResponse.json({ ok: false, error: 'Invalid account address' }, { status: 400 });
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const tokenAddress = process.env.AXG_TOKEN_ADDRESS;

    if (!rpcUrl) {
      return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    }
    if (!tokenAddress || !isHexAddress(tokenAddress)) {
      return NextResponse.json({ ok: false, error: 'AXG_TOKEN_ADDRESS missing/invalid' }, { status: 500 });
    }

    const ABI = [
      'function decimals() view returns (uint8)',
      'function balanceOf(address) view returns (uint256)',
      'function symbol() view returns (string)',
      'function name() view returns (string)',
    ] as const;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const token = new ethers.Contract(tokenAddress, ABI, provider);

    const [decimalsRaw, balanceRaw] = await Promise.all([
      token.decimals() as Promise<number>,
      token.balanceOf(account) as Promise<bigint>,
    ]);

    const decimals = Number(decimalsRaw);
    const balanceFormatted = ethers.formatUnits(balanceRaw, decimals);

    if (!withUSD) {
      return NextResponse.json({
        ok: true,
        address: tokenAddress,
        account,
        decimals,
        balance: balanceRaw.toString(),   // bigint → string
        balanceFormatted,                 // human-readable
      });
    }

    const p = readAxgUsdFromEnv();
    const value = Number(balanceFormatted || '0') * p.price;

    return NextResponse.json({
      ok: true,
      address: tokenAddress,
      account,
      decimals,
      balance: balanceRaw.toString(),
      balanceFormatted,
      usd: {
        ok: p.ok,
        source: p.source,
        price: p.price,
        priceStr: p.priceStr,
        value,
        valueStr: value.toFixed(2),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}