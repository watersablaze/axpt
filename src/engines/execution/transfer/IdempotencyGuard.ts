import type { TransferResult } from './TransferTypes'

export class IdempotencyGuard {
  private cache = new Map<string, TransferResult>()

  async check(key: string): Promise<TransferResult | null> {
    return this.cache.get(key) ?? null
  }

  async begin(key: string, _req: any) {
    // mark as in-progress if needed
  }

  async commit(key: string, result: TransferResult) {
    this.cache.set(key, result)
  }

  async fail(key: string, _error: any) {
    this.cache.delete(key)
  }
}
