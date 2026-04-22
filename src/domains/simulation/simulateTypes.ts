export type SimulationResult = {
  intent: string
  actions: {
    type: string
    willExecute: boolean
  }[]
  effects: {
    description: string
  }[]
  risks: {
    level: 'LOW' | 'MEDIUM' | 'HIGH'
    message: string
  }[]
}