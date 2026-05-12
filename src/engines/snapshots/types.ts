// src/engines/snapshots/types.ts

import type { UnifiedOrganismState } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'

export type OrganismSnapshot = {
  id: string
  timestamp: number
  tickIndex: number
  state: UnifiedOrganismState
  hash: string

  // 🆕 ADD THIS
  source?: SnapshotSource
}

export type SnapshotSource =
  | "CLOCK_TICK"
  | "CHAIN_EVENT"
  | "RECONCILIATION"