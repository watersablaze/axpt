import { NextResponse } from 'next/server';
import { getLatestUsdPrice } from '@/lib/chain/contracts';

export async function GET() {
  try {
    const p = await getLatestUsdPrice();
    // Ensure only JSON-friendly primitives:
    return NextResponse.json({
      ok: true,
      feedAddress: String(p.feedAddress),
      description: String(p.description),
      version: Number(p.version),
      decimals: Number(p.decimals),
      roundId: String(p.roundId),
      answer: String(p.answer),
      price: Number(p.price),
      priceStr: String(p.priceStr),
      updatedAt: Number(p.updatedAt),
      startedAt: Number(p.startedAt),
      answeredInRound: String(p.answeredInRound),
      updatedAtISO: new Date(Number(p.updatedAt) * 1000).toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}