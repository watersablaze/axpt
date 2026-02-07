import type { NommoSignal, NommoPhase } from './types';
import { getNommoPhase, hydrateNommoState, transitionNommoPhase } from './state';
import { logNommoEvent } from './persist';

function decideNext(phase: NommoPhase, signal: NommoSignal): NommoPhase | null {
  switch (signal.type) {
    case 'REQUEST_LIVE_START':
      return phase === 'DORMANT' ? 'INITIATION' : null;

    case 'STREAM_CONFIRMED_LIVE':
      return 'LIVE';

    case 'REQUEST_LIVE_STOP':
      return phase === 'LIVE' ? 'AFTERGLOW' : null;

    case 'STREAM_CONFIRMED_OFFLINE':
      return 'DORMANT';

    case 'INGEST_ERROR':
      return 'ERROR';

    case 'MANUAL_OVERRIDE':
      return signal.phase;

    default:
      return null;
  }
}

export async function processNommoSignal(
  signal: NommoSignal,
  meta?: { source?: string; idempotencyKey?: string; requestId?: string }
) {
  await hydrateNommoState();

  const prev = getNommoPhase();
  const next = decideNext(prev, signal);

  // Log event first with idempotency
  const logged = await logNommoEvent({
    signal,
    source: meta?.source,
    idempotencyKey: meta?.idempotencyKey,
    requestId: meta?.requestId,
    prevPhase: prev,
    nextPhase: next ?? prev,
  });

  if (logged.alreadyProcessed) return { phase: getNommoPhase(), ignored: true as const };

  // If no transition needed, stop
  if (!next || next === prev) return { phase: prev, ignored: true as const };

  await transitionNommoPhase(next);
  return { phase: next, ignored: false as const };
}