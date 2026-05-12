// src/engines/snapshots/AXPTOrganismSnapshotStore.ts

import type { OrganismSnapshot } from './types'
import type { UnifiedOrganismState } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'
import { organismClock } from '@/engines/runtime/serverSingletons'

/**
 * 🧬 SNAPSHOT STORE
 * Deterministic organism memory spine
 */
export class AXPTOrganismSnapshotStore {
  private snapshots: OrganismSnapshot[] = []

  private tickIndex = 0

  constructor() {
    this.bindClock()
  }

storeDerived(input: {
  source: "CHAIN_EVENT"
  caseId: string
  state: any
}) {
  const snapshot: OrganismSnapshot = {
    id: `${input.caseId}-${Date.now()}`,
    tickIndex: this.tickIndex++,
    timestamp: Date.now(),
    state: input.state,
    source: input.source,

    hash: this.hashState(input.state),
  }

  this.snapshots.push(Object.freeze(snapshot))
}

  /**
   * 🫀 CONNECT TO ORGANISM HEARTBEAT
   */
  private bindClock() {
    organismClock.subscribe((tick) => {
      const state = this.captureState(tick)
      this.store(state)
    })
  }

  /**
   * 🧠 CAPTURE PURE STATE SNAPSHOT
   */
  private captureState(tick: any): UnifiedOrganismState {
    // IMPORTANT:
    // we do NOT recompute here
    // only snapshot what already exists

    return tick.state ?? tick
  }

  /**
   * 📦 STORE SNAPSHOT (IMMUTABLE)
   */
  storeSnapshot(state: UnifiedOrganismState) {
    this.store(state)
  }

  private store(state: UnifiedOrganismState) {
    const snapshot: OrganismSnapshot = {
      id: `${this.tickIndex}-${state.timestamp}`,
      timestamp: state.timestamp,
      tickIndex: this.tickIndex++,
      state: structuredClone(state),
      hash: this.hashState(state),
    }

    this.snapshots.push(Object.freeze(snapshot))
  }

  /**
   * 🔍 QUERY API
   */
  getLatest(): OrganismSnapshot | null {
    return this.snapshots.at(-1) ?? null
  }

  latest(): OrganismSnapshot | null {
    return this.getLatest()
  }

  getAll(): OrganismSnapshot[] {
    return this.snapshots
  }

  getRange(from: number, to: number): OrganismSnapshot[] {
    return this.snapshots.slice(from, to)
  }

  /**
   * 🧬 DETERMINISTIC HASH (lightweight fingerprint)
   */
  private hashState(state: UnifiedOrganismState): string {
    const raw = JSON.stringify({
      d: state.drift,
      i: state.intensity,
      s: state.stability,
      r: state.riskLevel,
      p: state.phase,
      m: state.mutations,
      t: state.timestamp,
    })

    return this.simpleHash(raw)
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    }
    return hash.toString(16)
  }
}
