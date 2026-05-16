import crypto from "crypto"

import type { EscrowStatus } from "@/domains/escrow/escrowStatus"
import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"
import { EscrowStateMachine } from "./escrowStateMachine"

export type EscrowEventType =
  | "INITIATE"
  | "LOCK_FUNDS"
  | "DISPUTE"
  | "ARBITRATE"
  | "RELEASE"
  | "SETTLE"
  | "CANCEL"

export type EscrowEventRecord = {
  id: string
  timestamp: number
  type: EscrowEventType
  escrowId: string
}

function mapEventToStatus(event: EscrowEventType): EscrowStatus | null {
  switch (event) {
    case "INITIATE":
      return "INITIATED"
    case "LOCK_FUNDS":
      return "ACTIVE"
    case "DISPUTE":
      return "DISPUTED"
    case "ARBITRATE":
      return "ARBITRATED"
    case "RELEASE":
      return "RELEASED"
    case "SETTLE":
      return "SETTLED"
    case "CANCEL":
      return "CANCELLED"
    default:
      return null
  }
}

export type EscrowReplayResult = {
  escrowId: string
  finalState: EscrowStatus
  history: EscrowStatus[]
  invalidTransitions: string[]
}

export class EscrowReplayEngine {
  constructor(private machine: EscrowStateMachine) {}

  replay(events: EscrowEventRecord[]): EscrowReplayResult {
    if (events.length === 0) {
      throw new Error("[ESCROW REPLAY] No events to replay")
    }

    const escrowId = events[0].escrowId

    let state: EscrowStatus = "INITIATED"
    const history: EscrowStatus[] = [state]
    const invalidTransitions: string[] = []

    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)

    for (const event of sorted) {
      const next = mapEventToStatus(event.type)

      if (!next) continue

      try {
        this.machine.assertTransition(state, next)
        state = next
        history.push(state)
      } catch {
        invalidTransitions.push(`${state} → ${next} | event=${event.id}`)
      }
    }

    return {
      escrowId,
      finalState: state,
      history,
      invalidTransitions,
    }
  }

  replaySignal(events: EscrowEventRecord[]): ExecutionSignal {
    if (events.length === 0) {
      return {
        id: crypto.randomUUID(),
        source: "REPLAY",
        entityId: "UNKNOWN_ESCROW",
        severity: 0.6,
        confidence: 0.4,
        timestamp: Date.now(),
      }
    }

    const replay = this.replay(events)

    return {
      id: crypto.randomUUID(),
      source: "REPLAY",
      entityId: replay.escrowId,
      severity: replay.invalidTransitions.length ? 1 : 0,
      confidence: replay.invalidTransitions.length ? 0.5 : 1,
      timestamp: Date.now(),
    }
  }
}