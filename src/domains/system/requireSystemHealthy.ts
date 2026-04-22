import { detectSystemHealth } from './detectSystemHealth'

export async function requireSystemHealthy() {
  const health = await detectSystemHealth()

  if (health.state !== 'HEALTHY') {
    return {
      allowed: false,
      reason: health.reason ?? 'System degraded',
    }
  }

  return { allowed: true }
}