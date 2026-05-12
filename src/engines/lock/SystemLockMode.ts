type LockViolation =
  | "CLIENT_SINGLETON_IMPORT"
  | "DIRECT_ENGINE_UI_ACCESS"
  | "MULTIPLE_STREAMS_DETECTED"
  | "TRACE_BYPASS_ATTEMPT"
  | "GOVERNANCE_BYPASS"

export class SystemLockMode {
  private locked = true

  private violations: Array<{
    type: LockViolation
    context?: string
    timestamp: number
  }> = []

  /**
   * 🔒 GLOBAL LOCK STATE
   */
  isLocked() {
    return this.locked
  }

  unlock(reason: string) {
    console.warn("[SYSTEM LOCK] Disabled:", reason)
    this.locked = false
  }

  lock(reason: string) {
    console.warn("[SYSTEM LOCK] Enabled:", reason)
    this.locked = true
  }

  /**
   * 🚨 ARCHITECTURE GUARD
   */
  assert(condition: boolean, violation: LockViolation, context?: string) {
    if (!this.locked) return

    if (!condition) {
      this.violations.push({
        type: violation,
        context,
        timestamp: Date.now(),
      })

      throw new Error(
        `[SYSTEM LOCK VIOLATION] ${violation}${context ? ` → ${context}` : ""}`
      )
    }
  }

  /**
   * 📊 INSPECTION
   */
  getViolations() {
    return this.violations
  }

  clearViolations() {
    this.violations = []
  }
}

export const systemLock = new SystemLockMode()