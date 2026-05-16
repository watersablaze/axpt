import crypto from "crypto"

import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

import {
  isExecutionSignalSource,
} from "@/engines/contracts/ExecutionSignalGuards"

export class ExecutionSignalValidator {
  /**
   * STRICT INPUT GUARD
   *
   * Returns canonical ExecutionSignal only:
   * id, source, entityId, severity, confidence, timestamp
   */
  validate(signal: unknown): ExecutionSignal | null {
    if (!signal || typeof signal !== "object") return null

    const raw = signal as Partial<Record<keyof ExecutionSignal, unknown>>

    if (!isExecutionSignalSource(raw.source)) {
      return null
    }

    const id =
      typeof raw.id === "string" && raw.id.length > 0
        ? raw.id
        : crypto.randomUUID()

    const entityId =
      typeof raw.entityId === "string" && raw.entityId.length > 0
        ? raw.entityId
        : "UNKNOWN_ENTITY"

    return {
      id,
      source: raw.source,
      entityId,
      severity: this.clamp(raw.severity, 0),
      confidence: this.clamp(raw.confidence, 0.5),
      timestamp: this.normalizeTimestamp(raw.timestamp),
    }
  }

  /**
   * BATCH FILTER FOR ETK
   */
  filter(signals: unknown[]): ExecutionSignal[] {
    return signals
      .map((signal) => this.validate(signal))
      .filter((signal): signal is ExecutionSignal => signal !== null)
  }

  private normalizeTimestamp(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : Date.now()
  }

  private clamp(value: unknown, fallback: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback
    return Math.max(0, Math.min(1, value))
  }
}

export const executionSignalValidator =
  new ExecutionSignalValidator()