export type OrganismState = {
  breathPhase: 'INHALE' | 'HOLD' | 'DECAY' | 'EXHALE'
  breathIntensity: number

  drift: number
  stability: number

  mutationCount: number
  evolutionPressure: number

  lastEvent: string
  lastExecutionStatus: 'SUCCESS' | 'FAILED' | 'BLOCKED'

  timestamp: number
}
