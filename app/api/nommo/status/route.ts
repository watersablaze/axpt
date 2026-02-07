import { NextResponse } from 'next/server';
import { getNommoPhase } from '@/engines/nommo';
import { processNommoSignal } from '@/engines/nommo/signals';
import { hydrateNommoState } from '@/engines/nommo/state';

export async function GET() {
  await hydrateNommoState();

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/live/status`, {
      cache: 'no-store',
    });

    const data = await res.json();
    const online = Boolean(data?.telemetry?.online);
    const viewers = data?.telemetry?.viewers ?? 0;

    // Use deterministic idempotency key for polling window
    const minuteKey = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    const idempotencyKey = `nommo-poll-${minuteKey}-${online ? 'on' : 'off'}`;

    await processNommoSignal(
      online ? { type: 'STREAM_CONFIRMED_LIVE' } : { type: 'STREAM_CONFIRMED_OFFLINE' },
      { source: 'owncast', idempotencyKey }
    );

    return NextResponse.json({
      phase: getNommoPhase(),
      viewers,
    });
  } catch (err: any) {
    await processNommoSignal({ type: 'INGEST_ERROR' }, { source: 'system' });

    return NextResponse.json(
      { phase: 'ERROR', viewers: 0, error: err?.message ?? 'Nommo status failure' },
      { status: 500 }
    );
  }
}
