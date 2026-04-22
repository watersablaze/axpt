export const CLAIM_TTL_MS = 60_000
export const SUBMITTING_TTL_MS = 180_000
export const MAX_ATTEMPTS = 6
export const BATCH_SIZE = 10
export const CONFIRMATION_DEPTH = 2n
export const BASE_RETRY_DELAY_MS = 10_000
export const MAX_RETRY_DELAY_MS = 300_000
export const WORKER_LOOP_DELAY_MS = 2_000
export const HEARTBEAT_INTERVAL_MS = 5_000

export function computeRetryDelayMs(attempts: number) {
  const exponentialDelay = Math.min(
    BASE_RETRY_DELAY_MS * 2 ** Math.max(0, attempts - 1),
    MAX_RETRY_DELAY_MS
  )

  const jitter = Math.floor(Math.random() * 1_000)
  return exponentialDelay + jitter
}
