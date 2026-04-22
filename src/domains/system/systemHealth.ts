export type SystemHealthState = 'HEALTHY' | 'DEGRADED' | 'DOWN'

export type SystemHealth = {
  state: SystemHealthState
  services: {
    database: SystemHealthState
    chain: SystemHealthState
  }
  reason?: string
}