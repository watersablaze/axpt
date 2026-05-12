import { executionStream } from "@/engines/runtime/ExecutionStreamCore"
import { executionGovernance } from "@/engines/governance/ExecutionGovernanceLayer"
import { EXECUTION_VERSION } from "@/engines/contracts/ExecutionContracts"
import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"

export function attachWarRoomStream(ws: any) {

  executionStream.subscribe((snapshot) => {

    const decision = executionGovernance.evaluate({
  ...snapshot,
  divergence,
})

    if (!decision.allowed) {
      ws.send(JSON.stringify({
        type: "SNAPSHOT_BLOCKED",
        reason: decision.reason,
        payload: null
      }))

      executionTraceLedger.append({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "STREAM_BLOCKED",
        payload: snapshot,
        result: decision.reason
      })

      return
    }

    ws.send(JSON.stringify({
      type: "SNAPSHOT",
      version: EXECUTION_VERSION,
      payload: snapshot,
    }))

    ws.send(JSON.stringify({
      type: "GOVERNANCE_DECISION",
      version: EXECUTION_VERSION,
      payload: decision
    }))

    executionTraceLedger.append({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "WS_BROADCAST",
      payload: snapshot
    })
  })
}
