// src/engines/execution/boundary/ExecutionInputAdapter.ts

import type { ExecutionContract } from "@/engines/core/types/ExecutionContract"

/**
 * 🧠 LEGACY INPUT SHAPES (still exists in system)
 */
export type LegacyExecutionInput = {
  twin?: any
  risk?: any

  req?: {
    idempotencyKey?: string
    fromUserId?: string
    toUserId?: string
    assetCode?: string
    amountBaseUnits?: bigint | number | string
    metadata?: Record<string, any>
  }

  ctx?: any
}

/**
 * 🧱 NORMALIZED EXECUTION INPUT CONTRACT
 * This is what EVERYTHING becomes before ETK or downstream engines
 */
export type NormalizedExecutionInput = ExecutionContract

/**
 * 🔥 INPUT BOUNDARY ADAPTER
 */
export class ExecutionInputAdapter {

  /**
   * MAIN ENTRY POINT
   */
  static normalize(input: LegacyExecutionInput): NormalizedExecutionInput {

    const req = input.req ?? {}

    return {
      req: {
        idempotencyKey: this.ensureString(req.idempotencyKey),
        fromUserId: this.ensureString(req.fromUserId),
        toUserId: this.ensureString(req.toUserId),
        assetCode: this.ensureString(req.assetCode),
        amountBaseUnits: this.toBigInt(req.amountBaseUnits),
        metadata: req.metadata ?? {},
      },

      ctx: this.normalizeContext(input.ctx, req),
    }
  }

  /**
   * 🧠 CONTEXT NORMALIZATION LAYER
   * Converts ALL legacy ctx shapes into canonical execution context
   */
  private static normalizeContext(ctx: any, req: any) {
    return {
      escrowId: ctx?.escrowId ?? this.deriveEscrowId(req),

      environment: this.normalizeEnvironment(ctx?.environment),

      source: this.normalizeSource(ctx?.source),
    }
  }

  /**
   * 🔒 ENV NORMALIZATION
   */
  private static normalizeEnvironment(env: any): "PROD" | "SIM" | "TEST" {
    if (env === "PROD" || env === "SIM" || env === "TEST") return env
    return "SIM"
  }

  /**
   * 🔒 SOURCE NORMALIZATION
   */
  private static normalizeSource(
    source: any
  ): "SYSTEM" | "API" | "AGENT" {
    if (source === "SYSTEM" || source === "API" || source === "AGENT") {
      return source
    }
    return "SYSTEM"
  }

  /**
   * 🧬 ESCROW DERIVATION (FALLBACK KEYING)
   */
  private static deriveEscrowId(req: any): string {
    return (
      req?.idempotencyKey ??
      req?.fromUserId + ":" + req?.toUserId + ":" + Date.now()
    )
  }

  /**
   * 🧮 SAFE BIGINT CONVERSION
   */
  private static toBigInt(value: any): bigint {
    if (typeof value === "bigint") return value
    if (typeof value === "number") return BigInt(Math.floor(value))
    if (typeof value === "string") return BigInt(value || "0")
    return 0n
  }

  /**
   * 🧪 SAFE STRING GUARANTEE
   */
  private static ensureString(value: any): string {
    if (typeof value === "string") return value
    if (value == null) return ""
    return String(value)
  }
}