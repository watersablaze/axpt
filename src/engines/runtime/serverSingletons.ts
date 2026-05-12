import 'server-only'

import { AXPTEventBus } from '@/engines/events/AXPTEventBus'
import { GovernanceMutationLedger } from '@/engines/governance/mutations/GovernanceMutationLedger'
import { ReconciliationEngine } from '@/engines/reconciliation/ReconciliationEngine'
import { LedgerReplayEngine } from '@/engines/replay/LedgerReplayEngine'

import { AXPTBreathEngine } from './AXPTBreathEngine'
import { AXPTOrganismFieldEngine } from '@/engines/organism/AXPTOrganismFieldEngine'
import { AXPTUnifiedPulseEngine } from './AXPTUnifiedPulseEngine'
import { AXPTOrganismClockEngine } from './AXPTOrganismClockEngine'
import { AXPTOrganismSnapshotStore } from '@/engines/snapshots/AXPTOrganismSnapshotStore'

/**
 * ──────────────────────────────
 * 🧠 SERVER RUNTIME KERNEL (TRUTH LAYER)
 * ──────────────────────────────
 */

/**
 * 📡 EVENT BUS (SERVER NERVOUS SYSTEM)
 */
export const runtimeBus = new AXPTEventBus()

/**
 * 🧾 MUTATION LEDGER (IMMUTABLE HISTORY)
 */
export const mutationLedger = new GovernanceMutationLedger()

/**
 * 🔁 RECONCILIATION ENGINE (TRUTH VALIDATOR)
 */
export const reconciliationEngine = new ReconciliationEngine()

/**
 * 📜 LEDGER REPLAY (STATE RECONSTRUCTION)
 */
export const ledgerReplayEngine = new LedgerReplayEngine()

/**
 * 🫀 BREATH ENGINE (PHYSIOLOGICAL STATE DRIFT)
 */
export const breathEngine = new AXPTBreathEngine(
  runtimeBus,
  reconciliationEngine,
  mutationLedger
)

/**
 * 🧠 ORGANISM FIELD (STATE COMPOSITION ENGINE)
 */
export const unifiedOrganismFieldEngine = new AXPTOrganismFieldEngine(
  reconciliationEngine,
  mutationLedger
)

/**
 * 🔥 PULSE ENGINE (COGNITIVE AGGREGATION)
 */
export const pulseEngine = new AXPTUnifiedPulseEngine(
  breathEngine,
  reconciliationEngine,
  mutationLedger,
  ledgerReplayEngine
)

/**
 * 🫀 CLOCK (SERVER HEARTBEAT)
 */
export const organismClock = new AXPTOrganismClockEngine()

/**
 * 📦 SNAPSHOT STORE (DETERMINISTIC MEMORY)
 */
export const organismSnapshotStore = new AXPTOrganismSnapshotStore()