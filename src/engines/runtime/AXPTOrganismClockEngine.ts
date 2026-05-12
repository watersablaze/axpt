// src/engines/runtime/AXPTOrganismClockEngine.ts

import { unifiedOrganismFieldEngine } from './AXPTUnifiedOrganismFieldEngine'

export type OrganismTick = {
  tick: number
  timestamp: number

  phase: string
  drift: number
  intensity: number
  stability: number
  liquidity: number

  riskLevel: string
  decisionPressure: number
  mutations: number
}

type Listener = (tick: OrganismTick) => void

export class AXPTOrganismClockEngine {
  private listeners = new Set<Listener>()

  private tickIndex = 0
  private interval: NodeJS.Timeout | null = null

  private tickRate = 200

  private lastTick: OrganismTick | null = null

  /**
   * 🫀 START DETERMINISTIC CLOCK
   */
  start() {
    if (this.interval) return

    this.interval = setInterval(() => {
      this.tickIndex += 1
      this.tick()
    }, this.tickRate)
  }

  /**
   * 🧠 PURE TICK GENERATION
   */
  private tick() {
    const state = unifiedOrganismFieldEngine.getState()

    const tick: OrganismTick = {
      tick: this.tickIndex,

      // ❗ deterministic surrogate timestamp (NOT Date.now)
      timestamp: this.tickIndex * this.tickRate,

      phase: state.phase,

      drift: this.clamp(state.drift),
      intensity: this.clamp(state.intensity),
      stability: this.clamp(state.stability),
      liquidity: this.clamp(state.liquidity),

      riskLevel: state.riskLevel,
      decisionPressure: state.decisionPressure,
      mutations: state.mutations,
    }

    this.lastTick = Object.freeze(tick)

    this.broadcast(this.lastTick)
  }

  /**
   * 📡 SUBSCRIBE
   */
  subscribe(listener: Listener) {
    this.listeners.add(listener)

    if (this.lastTick) listener(this.lastTick)

    return () => this.listeners.delete(listener)
  }

  /**
   * 📡 BROADCAST
   */
  private broadcast(tick: OrganismTick) {
    for (const l of this.listeners) {
      l(tick)
    }
  }

  /**
   * 🧠 NORMALIZATION
   */
  private clamp(v: number) {
    if (Number.isNaN(v)) return 0
    return Math.max(0, Math.min(1, v))
  }

  /**
   * 🧪 DEBUG
   */
  getLastTick() {
    return this.lastTick
  }

  /**
   * 🛑 STOP CLOCK
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}