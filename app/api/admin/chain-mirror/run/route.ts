import { NextResponse } from 'next/server';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import { runChainMirrorWorker } from '@/engines/wallet/chainMirror';

export async function POST() {
  await requireElderServer();

  try {
    const results = await runChainMirrorWorker();
    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Chain mirror run failed' },
      { status: 500 }
    );
  }
}
