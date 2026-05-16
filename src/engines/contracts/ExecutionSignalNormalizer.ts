import crypto from "crypto"

import type {
  ExecutionSignal,
  ExecutionSignalSource,
} from "./ExecutionContracts"

import { isExecutionSignalSource } from "./ExecutionSignalGuards"

/**
 * PURPOSE:
 * Strict signal sanitization layer.
 *
 * This file does NOT enrich signals.
 * This file does NOT preserve legacy semantic fields.
 *
 * It only returns canonical ExecutionSignal objects:
 * id, source, entityId, severity, confidence, timestamp
 */
export class ExecutionSignalNormalizer {
  normalize(signals: unknown[]): ExecutionSignal[] {
    return signals
      .map((signal) => this.normalizeSignal(signal))
      .filter((signal): signal is ExecutionSignal => signal !== null)
  }

  private normalizeSignal(signal: unknown): ExecutionSignal | null {
    if (!signal || typeof signal !== "object") return null

    const raw = signal as Partial<Record<keyof ExecutionSignal, unknown>>
    const source = this.normalizeSource(raw.source)

    if (!source) return null

    return {
      id: this.normalizeId(raw.id),
      source,
      entityId: this.normalizeEntityId(raw.entityId),
      severity: this.clamp(raw.severity),
      confidence: this.clamp(raw.confidence),
      timestamp: this.normalizeTimestamp(raw.timestamp),
    }
  }

  private normalizeSource(value: unknown): ExecutionSignalSource | null {
    return isExecutionSignalSource(value) ? value : null
  }

  private normalizeId(value: unknown): string {
    return typeof value === "string" && value.length > 0
      ? value
      : crypto.randomUUID()
  }

  private normalizeEntityId(value: unknown): string {
    return typeof value === "string" && value.length > 0
      ? value
      : "UNKNOWN_ENTITY"
  }

  private normalizeTimestamp(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : Date.now()
  }

  private clamp(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
  }
}

export const executionSignalNormalizer =
  new ExecutionSignalNormalizer()