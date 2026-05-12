import { runtimeBus } from "@/engines/runtime/serverSingletons"

import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"
import { executionGraph } from "@/engines/graph/ExecutionGraphEngine"

import { onchainEscrowFinalizationEngine } from "../escrow/OnchainEscrowFinalizationEngine"

import { EXECUTION_VERSION } from "@/engines/contracts/ExecutionContracts"
import { executionContractValidator } from "@/engines/validation/ExecutionContractValidator"

import {
  ExecutionTruthKernel,
  type ExecutionDecision,
} from "@/engines/execution/kernel/ExecutionTruthKernel"
import { SignalAssembler } from "@/engines/signals/ExecutionSignalAssembler"

const etk = new ExecutionTruthKernel()

/**
 * CONTRACT
 */
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
  status?: string
  entityId?: string
  [key: string]: any
}

export class ExecutionStreamCore {
  private listeners = new Set<(snapshot: any) => void>()

  constructor() {
    this.initialize()
  }

  /**
   * PIPELINE ENTRY
   */
  private initialize() {
    runtimeBus.subscribe(async (event: any) => {
      const eventNodeId = crypto.randomUUID()

      executionGraph.addNode({
        id: eventNodeId,
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
        metadata: { correlationId: eventNodeId },
      })

      try {
        await this.ingest(event, eventNodeId)
      } catch (err) {
        executionTraceLedger.append({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: "UNHANDLED_PIPELINE_ERROR",
          payload: String(err),
          metadata: {
            correlationId: eventNodeId,
          },
        })
      }
    })
  }

  /**
   * INGESTION
   */
  private async ingest(event: any, eventNodeId: string) {
    const contractedEvent: ContractedEvent = {
      ...event,
      version: event.version ?? EXECUTION_VERSION,
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

    await this.process(contractedEvent, eventNodeId)
  }

  private async commitApprovedDecision(
    entityId: string,
    event: ContractedEvent,
    decision: Extract<ExecutionDecision, { status: "COMMIT" }>
  ) {
    const finalizer = onchainEscrowFinalizationEngine as any

    if (typeof finalizer.finalize === "function") {
      await finalizer.finalize({
        escrowId: entityId,
        plan: decision.executionPlan,
      })
      return
    }

    if (event.type === "CHAIN_ESCROW_CONFIRMED") {
      onchainEscrowFinalizationEngine.handleChainConfirmation({
        escrowId: entityId,
        txHash: event.txHash ?? "",
        blockNumber: event.blockNumber ?? 0,
        status: "CONFIRMED",
        from: event.from ?? event.wallet ?? "",
        to: event.to ?? "",
        amount: Number(event.amount ?? 0),
      })
    }
  }

  /**
   * CORE LOOP
   */
  private async process(
    contractedEvent: ContractedEvent,
    contractedNodeId: string
  ) {
    const entityId = this.resolveEntityId(contractedEvent)

    if (!entityId) {
      executionTraceLedger.append({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "ENTITY_RESOLUTION_FAILED",
        payload: contractedEvent,
        metadata: { correlationId: contractedNodeId },
      })
      return
    }

    const signals = await SignalAssembler.build(entityId, contractedEvent)

    const decision = etk.decide(signals, entityId)

    if (decision.status !== "COMMIT") {
      executionTraceLedger.append({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "EXECUTION_REJECTED_BY_ETK",
        payload: decision,
        metadata: { correlationId: contractedNodeId },
      })
      return
    }

    await this.commitApprovedDecision(entityId, contractedEvent, decision)

    executionTraceLedger.append({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "ETK_DECISION",
      payload: decision,
      metadata: { correlationId: contractedNodeId },
    })

    this.broadcast({
      entityId,
      event: contractedEvent,
      decision,
    })
  }
  

  /**
   * BROADCAST
   */
  private broadcast(snapshot: any) {
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }

  /**
   * ENTITY RESOLUTION
   */
  private resolveEntityId(event: ContractedEvent) {
    return event.escrowId ?? event.payload?.escrowId ?? event.entityId ?? null
  }

  /**
   * PUBLIC API
   */
  subscribe(listener: (snapshot: any) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const executionStream = new ExecutionStreamCore()
