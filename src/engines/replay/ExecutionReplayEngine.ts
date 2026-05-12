import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"
import { executionGraph } from "@/engines/graph/ExecutionGraphEngine"

export type ReplayFilter =
  | "ALL"
  | "ESCROW"
  | "GOVERNANCE"
  | "SNAPSHOT"
  | "BLOCKED"
  | "BROADCAST"

export class ExecutionReplayEngine {

  getTimeline(filter: ReplayFilter = "ALL") {
    const traces = executionTraceLedger.getAll()

    if (filter === "ALL") return traces

    return traces.filter(t => {
      if (filter === "ESCROW") return t.type.includes("ESCROW")
      if (filter === "GOVERNANCE") return t.type.includes("GOVERNANCE")
      if (filter === "SNAPSHOT") return t.type.includes("SNAPSHOT")
      if (filter === "BLOCKED") return t.type === "GOVERNANCE_BLOCKED"
      if (filter === "BROADCAST") return t.type === "WS_BROADCAST"
      return true
    })
  }

  /**
   * 🔍 FULL CAUSAL REPLAY (DAG TRACE)
   */
  getCausalChain(nodeId: string) {
    return executionGraph.trace(nodeId)
  }

  /**
   * 🧠 SNAPSHOT STATE AT TIME INDEX
   */
  replayAt(timestamp: number) {
    const traces = executionTraceLedger.getAll()

    return traces.filter(t => t.timestamp <= timestamp)
  }
}

export const executionReplayEngine = new ExecutionReplayEngine()