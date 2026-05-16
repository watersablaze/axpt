import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

export type ExecutionSignalTraceNode = {
  id: string
  source: string
  severity: number
  confidence: number
  weight: number
}

export class ExecutionSignalTraceMap {
  static explain(
    signals: ExecutionSignal[]
  ): ExecutionSignalTraceNode[] {
    return signals.map((signal) => ({
      id: signal.id,
      source: signal.source,
      severity: signal.severity,
      confidence: signal.confidence,
      weight: this.computeWeight(signal),
    }))
  }

  private static computeWeight(signal: ExecutionSignal): number {
    switch (signal.source) {
      case "GOVERNANCE":
        return 5

      case "DIVERGENCE":
        return 4

      case "RISK":
        return 3

      case "FINALITY":
        return 2

      default:
        return 1
    }
  }
}