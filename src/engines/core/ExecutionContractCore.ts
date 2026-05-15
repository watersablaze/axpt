import type { ExecutionContract } from "@/engines/core/types/ExecutionContract"
import type { ExecutionSignal, ExecutionDecision } from "@/engines/contracts"

export type ExecutionContext =
  ExecutionContract["ctx"] & {
    traceId: string
    requestId: string
  }

export type ExecutionRequest = ExecutionContract["req"] & {
  roles?: string[]
  context?: ExecutionContext
}

export type ExecutionResult = {
  decision: ExecutionDecision
  signals: ExecutionSignal[]
  context: ExecutionContext

  meta: {
    executed: boolean
    blocked: boolean
    timestamp: number
  }
}

/**
 * 🧭 EXECUTION CONTRACT CORE
 * Single spine for ALL execution flows
 */
export class ExecutionContractCore {
  buildContext(ctx: ExecutionContext): ExecutionContext {
    return {
      environment: ctx.environment,
      source: ctx.source,
      escrowId: ctx.escrowId,
      traceId: ctx.traceId,
      requestId: ctx.requestId,
    }
  }

  normalizeRequest(req: ExecutionRequest): ExecutionRequest {
    return {
      ...req,
      metadata: req.metadata ?? {},
      roles: req.roles ?? ["USER"],
    }
  }
}

export const executionContractCore = new ExecutionContractCore()