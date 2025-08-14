import { NextResponse } from 'next/server';
import { getLatestUsdPrice } from '@/lib/chain/contracts';

export async function GET() {
  try {
    const data = await getLatestUsdPrice();
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    console.error('[api/chain/price] error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Price feed error' }, { status: 500 });
  }
}