import { prisma } from '@/lib/prisma';
import type { NommoPhase, NommoSignal } from './types';

const STATE_ID = 'global';

export async function loadNommoPhase(): Promise<NommoPhase> {
  const row = await prisma.nommoState.findUnique({ where: { id: STATE_ID } });
  if (!row) return 'DORMANT';
  return row.phase as NommoPhase;
}

export async function saveNommoPhase(next: NommoPhase) {
  await prisma.nommoState.upsert({
    where: { id: STATE_ID },
    update: { phase: next, version: { increment: 1 } },
    create: { id: STATE_ID, phase: next },
  });
}

export async function logNommoEvent(args: {
  signal: NommoSignal;
  source?: string;
  idempotencyKey?: string;
  requestId?: string;
  prevPhase?: NommoPhase;
  nextPhase?: NommoPhase;
}) {
  const { signal, source, idempotencyKey, requestId, prevPhase, nextPhase } = args;

  // Idempotency: if key exists, do nothing
  if (idempotencyKey) {
    const existing = await prisma.nommoEvent.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return { alreadyProcessed: true as const };
  }

  await prisma.nommoEvent.create({
    data: {
      idempotencyKey: idempotencyKey ?? null,
      source: source ?? null,
      type: signal.type,
      payload: JSON.parse(JSON.stringify(signal)),
      prevPhase: prevPhase ?? null,
      nextPhase: nextPhase ?? null,
      requestId: requestId ?? null,
    },
  });

  return { alreadyProcessed: false as const };
}