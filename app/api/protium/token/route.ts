import { NextResponse } from 'next/server';
import { getProtiumToken } from '@/lib/chain/contracts';

export async function GET() {
  try {
    const token = getProtiumToken();
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      token.read.name(),
      token.read.symbol(),
      token.read.decimals(),
      token.read.totalSupply(),
    ]);

    return NextResponse.json({
      ok: true,
      token: {
        address: token.address,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(), // bigint → string
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}