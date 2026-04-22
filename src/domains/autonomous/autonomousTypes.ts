export type AutonomousDecision = {
  allowed: boolean
  reason: string
  intent?: string
  scenarioId?: string
  confidence?: number
}

export type AutonomousRunResult = {
  executed: boolean
  decision: AutonomousDecision
  actions?: { type: string }[]
}