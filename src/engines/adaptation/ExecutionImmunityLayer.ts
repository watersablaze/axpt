import { executionMemoryLedger } from "@/engines/memory/ExecutionMemoryLedger"

type ImmunityProfile = {
  entityId: string

  riskSensitivity: number
  driftSensitivity: number
  governanceSensitivity: number
  finalityThreshold: number
  systemResilience: number

  failureMemory: {
    pattern: string
    frequency: number
    severityImpact: number
  }[]
}

export class ExecutionImmunityLayer {

  private profiles = new Map<string, ImmunityProfile>()

  /**
   * 🧠 MAIN ENTRY
   */
  adapt(entityId: string) {

    const memory = executionMemoryLedger.get(entityId)

    const failures = memory.filter(
      m =>
        m.type === "BLOCK" ||
        m.type === "DIVERGENCE"
    )

    const profile = this.getOrCreate(entityId)

    // ─────────────────────────────
    // 1. LEARN FAILURE PATTERNS
    // ─────────────────────────────

    const patterns = this.extractPatterns(failures)

    profile.failureMemory = this.mergePatterns(
      profile.failureMemory,
      patterns
    )

    // ─────────────────────────────
    // 2. ADAPT SENSITIVITY
    // ─────────────────────────────

    const failureIntensity =
      failures.length / Math.max(1, memory.length)

    // risk becomes more strict under instability
    profile.riskSensitivity =
      0.5 + failureIntensity * 0.5

    // drift becomes more sensitive
    profile.driftSensitivity =
      0.4 + failureIntensity * 0.6

    // governance becomes more strict under chaos
    profile.governanceSensitivity =
      0.5 + failureIntensity * 0.4

    // finality becomes harder to reach under instability
    profile.finalityThreshold =
      0.6 + failureIntensity * 0.3

    profile.systemResilience =
      Math.max(0, 1 - failureIntensity)

    return profile
  }

  /**
   * 🧠 PATTERN EXTRACTION
   */
  private extractPatterns(failures: any[]) {
    return failures.map(f => ({
      pattern: f.type,
      frequency: 1,
      severityImpact: f.severity ?? 0.5,
    }))
  }

  /**
   * 🧠 PATTERN MERGE
   */
  private mergePatterns(
    existing: any[],
    incoming: any[]
  ) {

    const map = new Map<string, any>()

    for (const p of existing) {
      map.set(p.pattern, p)
    }

    for (const p of incoming) {
      const prev = map.get(p.pattern)

      if (prev) {
        prev.frequency += 1
        prev.severityImpact =
          (prev.severityImpact + p.severityImpact) / 2
      } else {
        map.set(p.pattern, p)
      }
    }

    return Array.from(map.values())
  }

  /**
   * 🧠 GET PROFILE
   */
  getOrCreate(entityId: string): ImmunityProfile {

    if (!this.profiles.has(entityId)) {
      this.profiles.set(entityId, {
        entityId,
        riskSensitivity: 0.5,
        driftSensitivity: 0.5,
        governanceSensitivity: 0.5,
        finalityThreshold: 0.6,
        systemResilience: 1,
        failureMemory: [],
      })
    }

    return this.profiles.get(entityId)!
  }
}

export const executionImmunityLayer =
  new ExecutionImmunityLayer()
