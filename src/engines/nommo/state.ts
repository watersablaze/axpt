import type { NommoPhase } from './types';
import { loadNommoPhase, saveNommoPhase } from './persist';

let hydrated = false;
let currentPhase: NommoPhase = 'DORMANT';

export async function hydrateNommoState() {
  if (hydrated) return;
  currentPhase = await loadNommoPhase();
  hydrated = true;
}

export function getNommoPhase(): NommoPhase {
  return currentPhase;
}

export async function transitionNommoPhase(next: NommoPhase) {
  // Guardrails (keep your rules here)
  if (currentPhase === 'ERROR' && next === 'LIVE') {
    throw new Error('Cannot jump from ERROR to LIVE');
  }

  currentPhase = next;

  // Persist snapshot
  await saveNommoPhase(next);
}