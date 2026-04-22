export type Scenario = {
  id: string
  label: string
  actions: { type: string }[]
}

export type ScenarioResult = {
  scenarioId: string
  effects: string[]
  risks: { level: 'LOW' | 'MEDIUM' | 'HIGH'; message: string }[]
  score: number
}