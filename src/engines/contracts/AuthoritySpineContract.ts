export type AuthoritySpineContract = {
  entityId: string

  // ─────────────────────────────
  // OBSERVED REALITY (Reality Engine)
  // ─────────────────────────────
  reality: {
    state: "STABLE" | "VOLATILE" | "DRIFTING" | "QUARANTINED" | "UNKNOWN"
    risk: number
    drift: number
    stability: number
    confidence: number
  }

  // ─────────────────────────────
  // INTENT (Operator Layer)
  // ─────────────────────────────
  intent: {
    type: string
    severity: number
    confidence: number
    payload?: unknown
  }

  // ─────────────────────────────
  // GOVERNANCE (ETK Layer)
  // ─────────────────────────────
  governance: {
    decision: "ALLOW" | "REJECT" | "ESCROW" | "QUARANTINE"
    reason?: string
    finalityScore: number
    riskScore: number
  }

  // ─────────────────────────────
  // SYSTEM TRACE (Cross-layer truth)
  // ─────────────────────────────
  trace: {
    traceId: string
    timestamp: number
    source: "REALITY" | "OPERATOR" | "ETK"
  }
}