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

type BreathListener = (signal: BreathSignal) => void

export class AXPTBreathVisualizer {
  private listeners = new Set<BreathListener>()
  private latest: BreathSignal | null = null

  subscribe(listener: BreathListener) {
    this.listeners.add(listener)

    if (this.latest) {
      listener(this.latest)
    }

    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot() {
    return this.latest
  }

  pulse(data: {
    phase: BreathPhase
    risk?: number
    drift?: number
    intensity?: number
  }) {
    const signal: BreathSignal = {
      phase: data.phase,
      intensity: this.clamp(data.intensity ?? this.defaultIntensity(data.phase)),
      risk: this.clamp(data.risk ?? 0),
      drift: this.clamp(data.drift ?? 0),
      timestamp: Date.now(),
    }

    this.latest = signal
    this.emit(signal)

    return signal
  }

  private emit(signal: BreathSignal) {
    for (const listener of this.listeners) {
      listener(signal)
    }
  }

  private defaultIntensity(phase: BreathPhase) {
    switch (phase) {
      case 'INHALE':
      case 'EXHALE':
        return 0.35
      case 'SIMULATE':
      case 'DECIDE':
        return 0.55
      case 'EXECUTE':
      case 'VERIFY':
        return 0.7
      case 'HEAL':
      case 'MUTATE':
        return 0.85
      default:
        return 0.5
    }
  }

  private clamp(value: number) {
    return Math.max(0, Math.min(1, value))
  }
}
