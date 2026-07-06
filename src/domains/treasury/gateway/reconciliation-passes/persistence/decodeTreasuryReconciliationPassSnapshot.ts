import { TREASURY_RECONCILIATION_PASS_STATUS } from "../status";

import type { TreasuryExecutionReconciliationBatchSummary } from "../../executions/application/runTreasuryExecutionReconciliationBatchContracts";

import type {
  TreasuryReconciliationPass,
  TreasuryReconciliationPassFailure,
} from "../contracts";

type JsonRecord = Record<string, unknown>;

function assertRecord(value: unknown): asserts value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("[TREASURY_RECONCILIATION_PASS_SNAPSHOT_INVALID]");
  }
}

function requireString(record: JsonRecord, key: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_FIELD_INVALID] ${key}`,
    );
  }

  return value;
}

function requirePositiveInteger(record: JsonRecord, key: string): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_FIELD_INVALID] ${key}`,
    );
  }

  return value;
}

function requireDate(record: JsonRecord, key: string): Date {
  const raw = requireString(record, key);

  const value = new Date(raw);

  if (Number.isNaN(value.getTime())) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_FIELD_INVALID] ${key}`,
    );
  }

  return value;
}

function optionalDate(record: JsonRecord, key: string): Date | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_FIELD_INVALID] ${key}`,
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_FIELD_INVALID] ${key}`,
    );
  }

  return date;
}

function decodeSummary(
  value: unknown,
): TreasuryExecutionReconciliationBatchSummary | undefined {
  if (value === undefined) {
    return undefined;
  }

  assertRecord(value);

  return {
    discovered: requirePositiveIntegerOrZero(value, "discovered"),

    processed: requirePositiveIntegerOrZero(value, "processed"),

    reconciled: requirePositiveIntegerOrZero(value, "reconciled"),

    failed: requirePositiveIntegerOrZero(value, "failed"),

    advanced: requirePositiveIntegerOrZero(value, "advanced"),

    unchanged: requirePositiveIntegerOrZero(value, "unchanged"),

    unsupported: requirePositiveIntegerOrZero(value, "unsupported"),

    ownershipMissing: requirePositiveIntegerOrZero(value, "ownershipMissing"),
  };
}

function requirePositiveIntegerOrZero(record: JsonRecord, key: string): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_SNAPSHOT_FIELD_INVALID] ${key}`,
    );
  }

  return value;
}

function decodeFailure(
  value: unknown,
): TreasuryReconciliationPassFailure | undefined {
  if (value === undefined) {
    return undefined;
  }

  assertRecord(value);

  return {
    errorCode: requireString(value, "errorCode"),

    errorMessage: requireString(value, "errorMessage"),
  };
}

export function decodeTreasuryReconciliationPassSnapshot(
  snapshot: unknown,
): TreasuryReconciliationPass {
  assertRecord(snapshot);

  const metadata = snapshot.metadata;

  assertRecord(metadata);

  const status = requireString(snapshot, "status");

  if (
    !Object.values(TREASURY_RECONCILIATION_PASS_STATUS).includes(
      status as TreasuryReconciliationPass["status"],
    )
  ) {
    throw new Error(`[TREASURY_RECONCILIATION_PASS_STATUS_INVALID] ${status}`);
  }

  return {
    id: requireString(snapshot, "id"),

    requestedLimit: requirePositiveInteger(snapshot, "requestedLimit"),

    status: status as TreasuryReconciliationPass["status"],

    requestedAt: requireDate(snapshot, "requestedAt"),

    startedAt: optionalDate(snapshot, "startedAt"),

    completedAt: optionalDate(snapshot, "completedAt"),

    summary: decodeSummary(snapshot.summary),

    failure: decodeFailure(snapshot.failure),

    metadata: {
      createdAt: requireDate(metadata, "createdAt"),

      updatedAt: requireDate(metadata, "updatedAt"),

      version: requirePositiveInteger(metadata, "version"),

      lastModifiedByActorId: requireString(metadata, "lastModifiedByActorId"),
    },
  };
}
