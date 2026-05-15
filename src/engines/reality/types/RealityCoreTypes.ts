export type RealityPoint = {
  entityId: string
  timestamp: number
  stability: number
  drift: number
  risk: number
  confidence?: number
}

export type RealityDelta = {
  entityId: string
  deltaStability: number
  deltaDrift: number
  deltaRisk: number
  intensity: number
}

export type RealityBehavior =
  | "UNSTABLE_AGGRESSIVE"
  | "STABLE_COMPLIANT"
  | "OSCILLATING_BEHAVIOR"
  | "NEUTRAL_SYSTEM"

export type RealityState =
  | "STABLE"
  | "DRIFTING"
  | "VOLATILE"
  | "QUARANTINED"
  | "UNKNOWN"

export type RealityArchetype = {
  entityId: string
  dominantBehavior: RealityState
  stabilityProfile: number
  driftProfile: number
  riskProfile: number
  confidence: number
}