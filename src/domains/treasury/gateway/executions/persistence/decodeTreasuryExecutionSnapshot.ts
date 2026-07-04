import { TREASURY_EXECUTION_KIND } from "../contracts";

import { TREASURY_EXECUTION_STATUS } from "../status";

import type { TreasuryExecution } from "../contracts";

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

function optionalDate(
  record: JsonRecord,
  key: string,
  code: string,
): Date | undefined {
  const value = optionalString(record, key, code);

  if (value === undefined) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`[${code}] ${key}`);
  }

  return date;
}

export function decodeTreasuryExecutionSnapshot(
  snapshot: unknown,
): TreasuryExecution {
  assertRecord(snapshot, "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID");

  const amount = snapshot.amount;

  assertRecord(amount, "TREASURY_GATEWAY_EXECUTION_AMOUNT_INVALID");

  const metadata = snapshot.metadata;

  assertRecord(metadata, "TREASURY_GATEWAY_EXECUTION_METADATA_INVALID");

  const kind = requireString(
    snapshot,
    "kind",
    "TREASURY_GATEWAY_EXECUTION_KIND_INVALID",
  );

  if (
    !Object.values(TREASURY_EXECUTION_KIND).includes(
      kind as TreasuryExecution["kind"],
    )
  ) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_KIND_INVALID] ${kind}`);
  }

  const status = requireString(
    snapshot,
    "status",
    "TREASURY_GATEWAY_EXECUTION_STATUS_INVALID",
  );

  if (
    !Object.values(TREASURY_EXECUTION_STATUS).includes(
      status as TreasuryExecution["status"],
    )
  ) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_STATUS_INVALID] ${status}`);
  }

  return {
    id: requireString(
      snapshot,
      "id",
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID",
    ),

    reference: requireString(
      snapshot,
      "reference",
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID",
    ),

    programId: requireString(
      snapshot,
      "programId",
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID",
    ),

    allocationId: requireString(
      snapshot,
      "allocationId",
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID",
    ),

    instructionId: optionalString(
      snapshot,
      "instructionId",
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID",
    ),

    kind: kind as TreasuryExecution["kind"],

    beneficiaryProfileId: optionalString(
      snapshot,
      "beneficiaryProfileId",
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID",
    ),

    settlementEndpointId: optionalString(
      snapshot,
      "settlementEndpointId",
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID",
    ),

    amount: {
      amount: requireString(
        amount,
        "amount",
        "TREASURY_GATEWAY_EXECUTION_AMOUNT_INVALID",
      ),

      currency: requireString(
        amount,
        "currency",
        "TREASURY_GATEWAY_EXECUTION_AMOUNT_INVALID",
      ),
    },

    purpose: requireString(
      snapshot,
      "purpose",
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_INVALID",
    ),

    status: status as TreasuryExecution["status"],

    validatedAt: optionalDate(
      snapshot,
      "validatedAt",
      "TREASURY_GATEWAY_EXECUTION_DATE_INVALID",
    ),

    authorizedAt: optionalDate(
      snapshot,
      "authorizedAt",
      "TREASURY_GATEWAY_EXECUTION_DATE_INVALID",
    ),

    metadata: {
      createdAt: requireDate(
        metadata,
        "createdAt",
        "TREASURY_GATEWAY_EXECUTION_METADATA_INVALID",
      ),

      updatedAt: requireDate(
        metadata,
        "updatedAt",
        "TREASURY_GATEWAY_EXECUTION_METADATA_INVALID",
      ),

      createdByActorId: requireString(
        metadata,
        "createdByActorId",
        "TREASURY_GATEWAY_EXECUTION_METADATA_INVALID",
      ),

      lastModifiedByActorId: requireString(
        metadata,
        "lastModifiedByActorId",
        "TREASURY_GATEWAY_EXECUTION_METADATA_INVALID",
      ),

      version: requireNumber(
        metadata,
        "version",
        "TREASURY_GATEWAY_EXECUTION_METADATA_INVALID",
      ),
    },
  };
}
