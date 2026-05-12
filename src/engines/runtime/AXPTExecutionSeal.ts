// src/engines/runtime/AXPTExecutionSeal.ts

import {
  organismClock,
  organismSnapshotStore,
} from './serverSingletons'
import { unifiedOrganismFieldEngine } from './AXPTUnifiedOrganismFieldEngine'

/**
 * 🔒 EXECUTION SEAL V2
 * Deterministic execution boundary for organism lifecycle
 */
export class AXPTExecutionSeal {
  private isSealed = false
  private isExecuting = false

  private tickCounter = 0

  /**
   * 🫀 INIT EXECUTION PIPELINE
   */
  init() {
    if (this.isSealed) return
    this.isSealed = true

    organismClock.subscribe(() => {
      this.executeOrganismTick()
    })
  }

  /**
   * 🧠 SINGLE EXECUTION GATE (STRICT DETERMINISM)
   */
  private executeOrganismTick() {
    if (this.isExecuting) return
    this.isExecuting = true

    try {
      this.tickCounter++

      // 1. deterministic state computation
      const state = unifiedOrganismFieldEngine.getState()

      // 2. freeze snapshot (immutability guarantee)
      const frozenState = Object.freeze({
        ...state,
        tick: this.tickCounter,
        sealedAt: Date.now(),
      })

      // 3. persist snapshot
      organismSnapshotStore.storeSnapshot(frozenState)

      // 4. execution hook (future AXG / intent bridge)
      this.onExecutionTick(frozenState)

    } finally {
      this.isExecuting = false
    }
  }

  /**
   * 🧭 EXECUTION HOOK (NO SIDE EFFECTS YET)
   * reserved for intent engine + wallet adapter
   */
  private onExecutionTick(state: any) {
    // intentionally empty for now
    // this becomes AXG + treasury execution boundary
  }

  /**
   * 🔐 SAFETY ASSERTION
   */
  assertSealed() {
    if (!this.isSealed) {
      throw new Error('AXPT EXECUTION SEAL NOT INITIALIZED')
    }
  }

  /**
   * 📊 DEBUG ACCESS
   */
  getTickCount() {
    return this.tickCounter
  }
}

/**
 * 🧬 SINGLETON
 */
export const executionSeal = new AXPTExecutionSeal()
