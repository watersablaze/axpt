export type BreathPhase =
  | 'INHALE'
  | 'SIMULATE'
  | 'DECIDE'
  | 'EXECUTE'
  | 'VERIFY'
  | 'HEAL'
  | 'MUTATE'
  | 'EXHALE'

export type BreathSignal = {
  phase: BreathPhase
  intensity: number
  drift: number
  risk: number
  timestamp: number
}

export class AXPTBreathVisualizer {
  private listeners: ((s: BreathSignal) => void)[] = []

  subscribe(fn: (s: BreathSignal) => void) {
    this.listeners.push(fn)
  }

  emit(signal: BreathSignal) {
    for (const fn of this.listeners) {
      fn(signal)
    }
  }

  /**
   * 🧬 CONTROLLED BREATH CYCLE EMISSION
   */
  pulse(data: {
    phase: BreathPhase
    risk?: number
    drift?: number
    intensity?: number
  }) {
    this.emit({
      phase: data.phase,
      intensity: data.intensity ?? 0.5,
      risk: data.risk ?? 0,
      drift: data.drift ?? 0,
      timestamp: Date.now(),
    })
  }
}