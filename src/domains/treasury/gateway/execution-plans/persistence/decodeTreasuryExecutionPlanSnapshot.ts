import { TREASURY_EXECUTION_KIND } from "../../executions/contracts";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../status";

import type { ExecutableTranche, TreasuryExecutionPlan } from "../contracts";

type JsonRecord = Record<string, unknown>;

function assertRecord(
  value: unknown,
  code: string,
): asserts value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`[${code}]`);
  }
}

function requireString(record: JsonRecord, key: string, code: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

function optionalString(
  record: JsonRecord,
  key: string,
  code: string,
): string | undefined {
  const value = record[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

function requireNumber(record: JsonRecord, key: string, code: string): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

function requireDate(record: JsonRecord, key: string, code: string): Date {
  const value = requireString(record, key, code);

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`[${code}] ${key}`);
  }

  return date;
}

function decodeMoney(value: unknown, code: string) {
  assertRecord(value, code);

  return {
    amount: requireString(value, "amount", code),

    currency: requireString(value, "currency", code),
  };
}

function decodeTranche(value: unknown): ExecutableTranche {
  assertRecord(value, "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID");

  const executionKind = requireString(
    value,
    "executionKind",
    "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_KIND_INVALID",
  );

  if (
    !Object.values(TREASURY_EXECUTION_KIND).includes(
      executionKind as ExecutableTranche["executionKind"],
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_KIND_INVALID] ${executionKind}`,
    );
  }

  const status = requireString(
    value,
    "status",
    "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_STATUS_INVALID",
  );

  if (
    !Object.values(EXECUTABLE_TRANCHE_STATUS).includes(
      status as ExecutableTranche["status"],
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_STATUS_INVALID] ${status}`,
    );
  }

  return {
    id: requireString(
      value,
      "id",
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID",
    ),

    sequence: requireNumber(
      value,
      "sequence",
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID",
    ),

    amount: decodeMoney(
      value.amount,
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_AMOUNT_INVALID",
    ),

    executionKind: executionKind as ExecutableTranche["executionKind"],

    allocationId: requireString(
      value,
      "allocationId",
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID",
    ),

    instructionId: optionalString(
      value,
      "instructionId",
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID",
    ),

    beneficiaryProfileId: optionalString(
      value,
      "beneficiaryProfileId",
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID",
    ),

    settlementEndpointId: requireString(
      value,
      "settlementEndpointId",
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID",
    ),

    purpose: requireString(
      value,
      "purpose",
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID",
    ),

    status: status as ExecutableTranche["status"],

    executionId: optionalString(
      value,
      "executionId",
      "TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHE_INVALID",
    ),
  };
}

export function decodeTreasuryExecutionPlanSnapshot(
  snapshot: unknown,
): TreasuryExecutionPlan {
  assertRecord(snapshot, "TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_INVALID");

  const metadata = snapshot.metadata;

  assertRecord(metadata, "TREASURY_GATEWAY_EXECUTION_PLAN_METADATA_INVALID");

  const status = requireString(
    snapshot,
    "status",
    "TREASURY_GATEWAY_EXECUTION_PLAN_STATUS_INVALID",
  );

  if (
    !Object.values(TREASURY_EXECUTION_PLAN_STATUS).includes(
      status as TreasuryExecutionPlan["status"],
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_STATUS_INVALID] ${status}`,
    );
  }

  const tranches = snapshot.tranches;

  if (!Array.isArray(tranches) || tranches.length === 0) {
    throw new Error("[TREASURY_GATEWAY_EXECUTION_PLAN_TRANCHES_INVALID]");
  }

  return {
    id: requireString(
      snapshot,
      "id",
      "TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_INVALID",
    ),

    transferId: requireString(
      snapshot,
      "transferId",
      "TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_INVALID",
    ),

    capacityAssessmentId: requireString(
      snapshot,
      "capacityAssessmentId",
      "TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_INVALID",
    ),

    plannedAmount: decodeMoney(
      snapshot.plannedAmount,
      "TREASURY_GATEWAY_EXECUTION_PLAN_AMOUNT_INVALID",
    ),

    destinationCurrency: requireString(
      snapshot,
      "destinationCurrency",
      "TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_INVALID",
    ),

    tranches: tranches.map(decodeTranche),

    status: status as TreasuryExecutionPlan["status"],

    plannedByActorId: requireString(
      snapshot,
      "plannedByActorId",
      "TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_INVALID",
    ),

    plannedAt: requireDate(
      snapshot,
      "plannedAt",
      "TREASURY_GATEWAY_EXECUTION_PLAN_DATE_INVALID",
    ),

    notes: optionalString(
      snapshot,
      "notes",
      "TREASURY_GATEWAY_EXECUTION_PLAN_SNAPSHOT_INVALID",
    ),

    metadata: {
      createdAt: requireDate(
        metadata,
        "createdAt",
        "TREASURY_GATEWAY_EXECUTION_PLAN_METADATA_INVALID",
      ),

      updatedAt: requireDate(
        metadata,
        "updatedAt",
        "TREASURY_GATEWAY_EXECUTION_PLAN_METADATA_INVALID",
      ),

      createdByActorId: requireString(
        metadata,
        "createdByActorId",
        "TREASURY_GATEWAY_EXECUTION_PLAN_METADATA_INVALID",
      ),

      lastModifiedByActorId: requireString(
        metadata,
        "lastModifiedByActorId",
        "TREASURY_GATEWAY_EXECUTION_PLAN_METADATA_INVALID",
      ),

      version: requireNumber(
        metadata,
        "version",
        "TREASURY_GATEWAY_EXECUTION_PLAN_METADATA_INVALID",
      ),
    },
  };
}
