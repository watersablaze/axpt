import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

export class ExecutionSignalTraceMap {

  static explain(signals: ExecutionSignal[]) {
    return signals.map(s => ({
      source: s.source,
      type: s.type,
      severity: s.severity,
      confidence: s.confidence,
      weight:
        s.source === "RISK" ? 3 :
        s.source === "DIVERGENCE" ? 4 :
        s.source === "GOVERNANCE" ? 5 :
        s.source === "FINALITY" ? 2 :
        1
    }))
  }

}