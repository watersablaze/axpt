import {
  TREASURY_ALLOCATION_PURPOSE,
  type TreasuryAllocation,
  type TreasuryAllocationPurpose,
} from "../contracts";

import {
  TREASURY_ALLOCATION_STATUS,
  type TreasuryAllocationStatus,
} from "../status";

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

function decodeMoney(value: unknown, code: string) {
  assertRecord(value, code);

  return {
    amount: requireString(value, "amount", code),

    currency: requireString(value, "currency", code),
  };
}

export function decodeTreasuryAllocationSnapshot(
  snapshot: unknown,
): TreasuryAllocation {
  assertRecord(
    snapshot,
    "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_INVALID",
  );

  const metadata = snapshot.metadata;

  assertRecord(
    metadata,
    "TREASURY_GATEWAY_ALLOCATION_METADATA_INVALID",
  );

  const purposeType = requireString(
    snapshot,
    "purposeType",
    "TREASURY_GATEWAY_ALLOCATION_PURPOSE_INVALID",
  );

  if (
    !Object.values(TREASURY_ALLOCATION_PURPOSE).includes(
      purposeType as TreasuryAllocationPurpose,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_ALLOCATION_PURPOSE_INVALID] ${purposeType}`,
    );
  }

  const status = requireString(
    snapshot,
    "status",
    "TREASURY_GATEWAY_ALLOCATION_STATUS_INVALID",
  );

  if (
    !Object.values(TREASURY_ALLOCATION_STATUS).includes(
      status as TreasuryAllocationStatus,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_ALLOCATION_STATUS_INVALID] ${status}`,
    );
  }

  const instructionId = optionalString(
    snapshot,
    "instructionId",
    "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_INVALID",
  );

  const purposeReference = optionalString(
    snapshot,
    "purposeReference",
    "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_INVALID",
  );

  const approvedByActorId = optionalString(
    snapshot,
    "approvedByActorId",
    "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_INVALID",
  );

  const approvedAt = optionalDate(
    snapshot,
    "approvedAt",
    "TREASURY_GATEWAY_ALLOCATION_DATE_INVALID",
  );

  const activatedAt = optionalDate(
    snapshot,
    "activatedAt",
    "TREASURY_GATEWAY_ALLOCATION_DATE_INVALID",
  );

  return {
    id: requireString(
      snapshot,
      "id",
      "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_INVALID",
    ),

    reference: requireString(
      snapshot,
      "reference",
      "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_INVALID",
    ),

    programId: requireString(
      snapshot,
      "programId",
      "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_INVALID",
    ),

    sourceProgramAccountId: requireString(
      snapshot,
      "sourceProgramAccountId",
      "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_INVALID",
    ),

    ...(instructionId ? { instructionId } : {}),

    purposeType: purposeType as TreasuryAllocationPurpose,

    ...(purposeReference ? { purposeReference } : {}),

    amount: decodeMoney(
      snapshot.amount,
      "TREASURY_GATEWAY_ALLOCATION_AMOUNT_INVALID",
    ),

    consumedAmount: decodeMoney(
      snapshot.consumedAmount,
      "TREASURY_GATEWAY_ALLOCATION_CONSUMED_AMOUNT_INVALID",
    ),

    status: status as TreasuryAllocationStatus,

    ...(approvedByActorId ? { approvedByActorId } : {}),

    ...(approvedAt ? { approvedAt } : {}),

    ...(activatedAt ? { activatedAt } : {}),

    metadata: {
      createdAt: requireDate(
        metadata,
        "createdAt",
        "TREASURY_GATEWAY_ALLOCATION_METADATA_INVALID",
      ),

      updatedAt: requireDate(
        metadata,
        "updatedAt",
        "TREASURY_GATEWAY_ALLOCATION_METADATA_INVALID",
      ),

      createdByActorId: requireString(
        metadata,
        "createdByActorId",
        "TREASURY_GATEWAY_ALLOCATION_METADATA_INVALID",
      ),

      lastModifiedByActorId: requireString(
        metadata,
        "lastModifiedByActorId",
        "TREASURY_GATEWAY_ALLOCATION_METADATA_INVALID",
      ),

      version: requireNumber(
        metadata,
        "version",
        "TREASURY_GATEWAY_ALLOCATION_METADATA_INVALID",
      ),
    },
  };
}
