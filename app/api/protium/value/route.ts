import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isHexAddress(a: string): a is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const account = (searchParams.get('account') || '').trim();
    if (!isHexAddress(account)) {
      return NextResponse.json({ ok: false, error: 'Invalid account address' }, { status: 400 });
    }
    const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/protium/balance?account=${account}&withUSD=1`, {
      cache: 'no-store',
    }).catch(() => null);

    if (!r) return NextResponse.json({ ok: false, error: 'Upstream fetch failed' }, { status: 502 });
    const j = await r.json().catch(() => null);
    if (!j?.ok) return NextResponse.json({ ok: false, error: j?.error || 'Upstream error' }, { status: 502 });

    return NextResponse.json({
      ok: true,
      balanceFormatted: j.balanceFormatted ?? '0.00',
      valueStr: j.usd?.valueStr ?? '0.00',
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}