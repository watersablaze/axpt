// app/api/protium/balance/route.ts
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isHexAddress(a: string): a is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

function readPrtUsdFromEnv() {
  const raw = process.env.NEXT_PUBLIC_PRT_USD_PRICE || process.env.PRT_USD_PRICE;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    return { ok: true as const, price: 1, priceStr: '1.00', source: 'env-default' as const };
  }
  return { ok: true as const, price: num, priceStr: num.toFixed(2), source: 'env' as const };
}

// Recursively convert bigint -> string so NextResponse.json never throws
function safeJson<T = any>(obj: T): T {
  if (typeof obj === 'bigint') return obj.toString() as any;
  if (Array.isArray(obj)) return obj.map(safeJson) as any;
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, safeJson(v)])) as any;
  }
  return obj;
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
    const tokenAddress = process.env.PROTIUM_TOKEN_ADDRESS;

    if (!rpcUrl) {
      return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    }
    if (!tokenAddress || !isHexAddress(tokenAddress)) {
      return NextResponse.json({ ok: false, error: 'PROTIUM_TOKEN_ADDRESS missing/invalid' }, { status: 500 });
    }

    const ABI = [
      'function decimals() view returns (uint8)',
      'function balanceOf(address) view returns (uint256)',
      'function symbol() view returns (string)',
      'function name() view returns (string)',
    ] as const;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const token = new ethers.Contract(tokenAddress, ABI, provider);

    const [decimalsRaw, balRaw] = await Promise.all([
      token.decimals() as Promise<number>,     // v6 returns number here
      token.balanceOf(account) as Promise<bigint>, // bigint
    ]);

    const decimals = Number(decimalsRaw);
    const balanceFormatted = ethers.formatUnits(balRaw, decimals);

    if (!withUSD) {
      return NextResponse.json(
        safeJson({
          ok: true,
          address: tokenAddress,
          account,
          decimals,
          balance: balRaw,           // safeJson will stringify bigint
          balanceFormatted,
        }),
      );
    }

    const p = readPrtUsdFromEnv();
    const value = Number(balanceFormatted || '0') * p.price;

    return NextResponse.json(
      safeJson({
        ok: true,
        address: tokenAddress,
        account,
        decimals,
        balance: balRaw,
        balanceFormatted,
        usd: {
          ok: p.ok,
          source: p.source,
          price: p.price,
          priceStr: p.priceStr,
          value,
          valueStr: value.toFixed(2),
        },
      }),
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}