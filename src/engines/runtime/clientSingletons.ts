// ⚠️ TEMPORARY SAFE CLIENT LAYER
// This is NOT a simulation engine anymore
// It only consumes server snapshots

export type ClientOrganismSnapshot = {
  tickIndex?: number
  source?: string
  timestamp?: number

  phase?: string
  intensity?: number
  mutations?: number
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

  decisionPressure: number
  drift: number
  liquidity: number
  stability: number

  breathPhase?: string
  breathIntensity?: number
  mutationCount?: number
  evolutionPressure?: number
  lastExecutionStatus?: string

  // 🧠 COMPATIBILITY EXTENSIONS (IMPORTANT)
  risk?: number
  finality?: number
  collapseRisk?: number
}

/**
 * 🧊 EMPTY CLIENT STATE (NO SIMULATION)
 * Replaced later by WS stream / snapshot API
 */
export const unifiedOrganismFieldEngine = {
  getState(): ClientOrganismSnapshot {
    return {
      tickIndex: 0,
      source: "CLIENT_SNAPSHOT",
      timestamp: Date.now(),

      phase: "STATIC",
      intensity: 0,
      mutations: 0,
      riskLevel: "LOW",

      decisionPressure: 0,
      drift: 0,
      liquidity: 0,
      stability: 1,

      breathPhase: "STATIC",
      breathIntensity: 0,
      mutationCount: 0,
      evolutionPressure: 0,
      lastExecutionStatus: "IDLE",

      risk: 0,
      finality: 1,
      collapseRisk: 0,
    }
  },
}

/**
 * 🧊 NO-OP CLOCK (DISABLED SIMULATION LOOP)
 */
export const organismClock = {
  start() {
    return undefined
  },

  stop() {
    return undefined
  },

  subscribe(fn: (t: any) => void) {
    const id = setInterval(() => {
      fn({
        tick: 0,
        timestamp: Date.now(),
        phase: "STATIC",
        drift: 0,
        intensity: 0,
        stability: 0,
        liquidity: 0,
        riskLevel: "LOW",
        decisionPressure: 0,
        mutations: 0,
        state: unifiedOrganismFieldEngine.getState(),
      })
    }, 2000)

    return () => clearInterval(id)
  },
}

/**
 * 🧊 EMPTY SNAPSHOT STORE (NO MEMORY SIMULATION)
 */
export const organismSnapshotStore = {
  getAll(): Array<{
    tickIndex?: number
    source?: string
    state?: ClientOrganismSnapshot
  }> {
    return []
  },
  getLatest(): {
    tickIndex?: number
    source?: string
    state?: ClientOrganismSnapshot
  } | null {
    return null
  },
}
