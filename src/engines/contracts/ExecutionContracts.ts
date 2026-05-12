export const EXECUTION_VERSION = "1.0.0"

export type ExecutionSignalSource =
  | "INTENT"
  | "REPLAY"
  | "GOVERNANCE"
  | "FINALITY"
  | "SIMULATION"
  | "TREASURY"
  | "SYSTEM"
  | "COGNITION"
  | "DRIFT"
  | "RISK"
  | "RECONCILIATION"
  | "DIVERGENCE"

export type ExecutionSignal = {
  source: ExecutionSignalSource

  /**
   * Logical classification inside ETK
   * (NOT same as source)
   */
  type: string

  /**
   * Risk or magnitude scalar (0–1)
   */
  severity: number

  /**
   * Model confidence in signal validity (0–1)
   */
  confidence: number

  /**
   * Temporal stamp for ordering & replay
   */
  timestamp: number

  /**
   * Optional decision hint from source layer
   * (ONLY used by governance/reconciliation today)
   */
  decision?: "ALLOW" | "REJECT"

  /**
   * Optional state payload (replay, divergence, etc.)
   */
  state?: string | null

  /**
   * Transitional replay state alias while replay producers migrate payload shape.
   */
  replayState?: string | null

  /**
   * Full raw payload from origin engine
   */
  payload?: unknown
}

export type ExecutionDecision =
  | {
      status: "BLOCK" | "REJECT"
      reason: string
    }
  | {
      status: "COMMIT"

      executionPlan: {
        /**
         * Derived replay outcome
         */
        replayState?: string | null

        /**
         * Governance approval flag
         */
        governanceApproved: boolean

        /**
         * Treasury / execution risk (0–1)
         */
        riskLevel: number

        /**
         * Finality confidence from temporal system (0–1)
         */
        finalityScore: number

        /**
         * Cognitive / operator confidence (0–1)
         */
        cognitiveConfidence: number

        /**
         * Collapse probability (0–1)
         */
        collapseRisk: number

        /**
         * Temporal stability score (0–1)
         */
        stabilityScore: number
      }
    }
