import crypto from "crypto"
import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"

export type ExecutionIntentType =
  | "ESCROW_FINALIZE"
  | "ESCROW_RELEASE"
  | "ESCROW_REFUND"
  | "LIQUIDITY_REBALANCE"

export type ExecutionIntent = {
  id: string
  type: ExecutionIntentType
  timestamp: number
  escrowId: string

  proofPackHash: string
  snapshotHash: string
  replayHash: string

  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

  payload: any
}

type IntentListener = (intent: ExecutionIntent) => void

export class ExecutionIntentBus {
  private queue: ExecutionIntent[] = []
  private listeners = new Set<IntentListener>()

  /**
   * 🧠 APPEND ONLY INTENT ENTRY
   */
  emit(intent: Omit<ExecutionIntent, "id" | "timestamp">) {
    const fullIntent: ExecutionIntent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...intent,
    }

    this.queue.push(fullIntent)

    executionTraceLedger.append({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "EXECUTION_INTENT_EMITTED",
      payload: fullIntent,
    })

    this.notify(fullIntent)

    return fullIntent.id
  }

  /**
   * 📡 SUBSCRIBE TO INTENTS
   */
  subscribe(listener: IntentListener) {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * 🔁 REPLAY MODE (deterministic reconstruction)
   */
  replay(filter?: (intent: ExecutionIntent) => boolean) {
    return this.queue.filter(filter ?? (() => true))
  }

  /**
   * 📡 INTERNAL BROADCAST
   */
  private notify(intent: ExecutionIntent) {
    for (const listener of this.listeners) {
      listener(intent)
    }
  }

  /**
   * 🧭 READ-ONLY ACCESS
   */
  getAll() {
    return [...this.queue]
  }
}

export const executionIntentBus = new ExecutionIntentBus()