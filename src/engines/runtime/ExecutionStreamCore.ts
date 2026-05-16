import { runtimeBus } from "@/engines/runtime/serverSingletons"

import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"
import { executionGraph } from "@/engines/graph/ExecutionGraphEngine"

import { onchainEscrowFinalizationEngine } from "../escrow/OnchainEscrowFinalizationEngine"
import type { EscrowStatus } from "@/domains/escrow/escrowStatus"

import { authoritySpineCompiler } from "@/engines/operator/AuthoritySpineCompiler"
import { executionContractValidator } from "@/engines/validation/ExecutionContractValidator"

import {
  ExecutionTruthKernel,
  type ETKDecision,
  type ETKTrace,
} from "@/engines/execution/kernel/ExecutionTruthKernel"

import { executionSignalAssembler } from "@/engines/signals/ExecutionSignalAssembler"

const etk = new ExecutionTruthKernel()

type ContractedEvent = {
  version: string
  type: string
  timestamp: number
  payload?: any
  escrowId?: string
  amount?: number | bigint
  wallet?: string
  to?: string
  from?: string
  txHash?: string
  blockNumber?: number
  status?: EscrowStatus
  entityId?: string
  [key: string]: any
}

function asEscrowStatus(value: unknown): EscrowStatus | undefined {
  if (
    value === "INITIATED" ||
    value === "ACTIVE" ||
    value === "FUNDS_LOCKED" ||
    value === "DISPUTED" ||
    value === "ARBITRATED" ||
    value === "RELEASED" ||
    value === "SETTLED" ||
    value === "CANCELLED"
  ) {
    return value
  }

  return undefined
}

export class ExecutionStreamCore {
  private listeners = new Set<(snapshot: any) => void>()

  constructor() {
    this.initialize()
  }

  private initialize() {
    runtimeBus.subscribe(async (event: any) => {
      const nodeId = crypto.randomUUID()

      executionGraph.addNode({
        id: nodeId,
        type: "EVENT",
        timestamp: Date.now(),
        data: event,
      })

      executionTraceLedger.append({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "EVENT_RECEIVED",
        eventType: event.type,
        payload: event,
        metadata: { correlationId: nodeId },
      })

      try {
        await this.ingest(event, nodeId)
      } catch (err) {
        executionTraceLedger.append({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: "UNHANDLED_PIPELINE_ERROR",
          payload: String(err),
          metadata: { correlationId: nodeId },
        })
      }
    })
  }

  private async ingest(event: any, nodeId: string) {
    const contractedEvent: ContractedEvent = {
      ...event,
      version: event.version ?? "1.0",
      timestamp: event.timestamp ?? Date.now(),
    }

    const validation = executionContractValidator.validateEvent(contractedEvent)

    if (!validation.valid) {
      executionTraceLedger.append({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "EVENT_REJECTED",
        payload: contractedEvent,
        result: validation.errors,
      })
      return
    }

    await this.process(contractedEvent, nodeId)
  }

  private async process(event: ContractedEvent, nodeId: string) {

    const entityId = this.resolveEntityId(event)
    if (!entityId) return

    /* ─────────────────────────────
       1. SIGNALS
    ───────────────────────────── */
    const normalizedEvent: ContractedEvent = {
      ...event,
      status: asEscrowStatus(event.status),
    }

    const signals =
      await executionSignalAssembler.build(
        entityId,
        normalizedEvent
      )

    /* ─────────────────────────────
       2. SPINE
    ───────────────────────────── */
    const spine = authoritySpineCompiler.build(
      signals,
      entityId,
      {
        source: "STREAM_CORE",
        eventType: event.type,
      }
    )

    /* ─────────────────────────────
       3. ETK
    ───────────────────────────── */
    const etkResult = etk.decide(spine)

    /* ─────────────────────────────
       4. GATE
    ───────────────────────────── */
    if (
      process.env.ETK_PHASE_2_SHADOW === "false" &&
      etkResult.decision.status !== "ALLOW"
    ) {
      executionTraceLedger.append({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "EXECUTION_REJECTED_BY_ETK",
        payload: etkResult.decision,
        metadata: { correlationId: nodeId },
      })
      return
    }

    /* ─────────────────────────────
       5. FINALIZATION
    ───────────────────────────── */
    await this.commit(entityId, event, etkResult.decision, etkResult.trace)

    executionTraceLedger.append({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "ETK_DECISION",
      payload: etkResult,
      metadata: { correlationId: nodeId },
    })

    this.broadcast({
      entityId,
      event,
      decision: etkResult.decision,
      trace: etkResult.trace,
    })
  }

  private async commit(
    entityId: string,
    event: ContractedEvent,
    decision: ETKDecision,
    trace: ETKTrace
  ) {
    if (event.type === "CHAIN_ESCROW_CONFIRMED") {
      onchainEscrowFinalizationEngine.handleChainConfirmation({
        escrowId: entityId,
        txHash: event.txHash ?? "",
        blockNumber: event.blockNumber ?? 0,
        status: "CONFIRMED",
        from: event.from ?? "",
        to: event.to ?? "",
        amount: Number(event.amount ?? 0),
      })
    }
  }

  private broadcast(snapshot: any) {
    for (const l of this.listeners) l(snapshot)
  }

  private resolveEntityId(event: ContractedEvent) {
    return event.escrowId ?? event.entityId ?? event.payload?.escrowId ?? null
  }

  subscribe(listener: (snapshot: any) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const executionStream = new ExecutionStreamCore()