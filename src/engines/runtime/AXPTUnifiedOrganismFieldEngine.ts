import { breathEngine, mutationLedger } from './serverSingletons'
import type { OrganismStream } from './AXPTBreathEngine'

export type UnifiedOrganismState = {
  timestamp: number
  caseId?: string

  breath: OrganismStream

  drift: number
  stability: number
  liquidity: number

  phase: string
  intensity: number

  mutations: number

  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

  decisionPressure: number
  breathPhase: string
  breathIntensity: number
  mutationCount: number
  evolutionPressure: number
  lastExecutionStatus: string
  narrative?: string
}

/**
 * 🧬 PURE COMPUTE ENGINE
 * deterministic projection ONLY
 * no mutation, no caching, no internal state
 */

/**
 * 🧬 PURE ORGANISM SNAPSHOT ENGINE
 */
export class AXPTUnifiedOrganismFieldEngine {

  /**
   * 🔄 PURE COMPUTATION (NO SIDE EFFECTS)
   */
  getState(): UnifiedOrganismState {
    const breath = breathEngine.getOrganismStream()

    const mutations = mutationLedger.getHistory().length

    const drift = clamp(breath.drift ?? 0)
    const intensity = clamp(breath.intensity ?? 0)
    const stability = clamp(breath.stability ?? 0)

    const liquidity = clamp(stability)

    const decisionPressure = clamp(
      drift * 0.5 +
      intensity * 0.3 +
      (1 - stability) * 0.2
    )

    return {
      timestamp: breath.timestamp ?? Date.now(),

      breath,

      drift,
      stability,
      liquidity,

      phase: breath.phase,
      intensity,

      mutations,

      riskLevel: this.computeRisk(decisionPressure),

      decisionPressure,
      breathPhase: breath.phase,
      breathIntensity: intensity,
      mutationCount: mutations,
      evolutionPressure: mutations * drift,
      lastExecutionStatus: decisionPressure > 0.85 ? "BLOCKED" : "SUCCESS",
    }
  }

  /**
   * 🧠 PURE RISK FUNCTION
   */
  private computeRisk(p: number): UnifiedOrganismState['riskLevel'] {
    if (p > 0.85) return 'CRITICAL'
    if (p > 0.6) return 'HIGH'
    if (p > 0.3) return 'MEDIUM'
    return 'LOW'
  }
}

/**
 * 🔧 PURE FUNCTION UTILITY
 */
function clamp(v: number) {
  return Math.max(0, Math.min(1, v))
}

export const unifiedOrganismFieldEngine =
  new AXPTUnifiedOrganismFieldEngine()
