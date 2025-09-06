import { NextResponse } from 'next/server';
import { getProtiumToken } from '@/lib/chain/contracts';

export async function GET() {
  try {
    const token = getProtiumToken();
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.totalSupply() as Promise<bigint>,
    ]);

    return NextResponse.json({
      ok: true,
      token: {
        address: token.target as string,
        name: String(name),
        symbol: String(symbol),
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}