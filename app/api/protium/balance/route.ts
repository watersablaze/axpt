import { NextResponse } from 'next/server';
import { getProtiumToken } from '@/lib/chain/contracts';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Back-compat: accept ?address=… or ?account=…
    const raw = (searchParams.get('account') || searchParams.get('address') || '').trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(raw)) {
      return NextResponse.json({ ok: false, error: 'Invalid account address' }, { status: 400 });
    }

    const account = raw as `0x${string}`;
    const token = getProtiumToken();
    const [decimals, rawBal] = await Promise.all([
      token.read.decimals(),
      token.read.balanceOf({ account }),
    ]);

    return NextResponse.json({
      ok: true,
      address: token.address,
      account,
      decimals: Number(decimals),
      balance: rawBal.toString(), // bigint → string
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}