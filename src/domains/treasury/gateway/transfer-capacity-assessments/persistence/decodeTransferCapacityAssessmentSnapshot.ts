import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
  type TransferCapacityAssessment,
  type TransferCapacityConstraint,
} from "../contracts";

import type { TreasuryMoney } from "../../shared/money";

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

function decodeStringArray(value: unknown, code: string): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`[${code}]`);
  }

  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new Error(`[${code}] ${index}`);
    }

    return entry;
  });
}

function decodeMoney(value: unknown, code: string): TreasuryMoney {
  assertRecord(value, code);

  return {
    amount: requireString(value, "amount", code),

    currency: requireString(value, "currency", code),
  };
}

function decodeOptionalMoney(
  value: unknown,
  code: string,
): TreasuryMoney | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return decodeMoney(value, code);
}

function decodeConstraint(
  value: unknown,
  index: number,
): TransferCapacityConstraint {
  const code = `TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_CONSTRAINT_INVALID:${index}`;

  assertRecord(value, code);

  const type = requireString(value, "type", code);

  if (
    !Object.values(TRANSFER_CAPACITY_CONSTRAINT_TYPE).includes(
      type as TransferCapacityConstraint["type"],
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_CONSTRAINT_TYPE_INVALID] ${type}`,
    );
  }

  const status = requireString(value, "status", code);

  if (
    !Object.values(TRANSFER_CAPACITY_CONSTRAINT_STATUS).includes(
      status as TransferCapacityConstraint["status"],
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_CONSTRAINT_STATUS_INVALID] ${status}`,
    );
  }

  const limit = decodeOptionalMoney(value.limit, `${code}:LIMIT`);

  const notes = optionalString(value, "notes", code);

  return {
    type: type as TransferCapacityConstraint["type"],

    status: status as TransferCapacityConstraint["status"],

    ...(limit
      ? {
          limit,
        }
      : {}),

    evidenceReferenceIds: decodeStringArray(
      value.evidenceReferenceIds,
      `${code}:EVIDENCE`,
    ),

    ...(notes
      ? {
          notes,
        }
      : {}),
  };
}

function decodeConstraints(
  value: unknown,
): readonly TransferCapacityConstraint[] {
  if (!Array.isArray(value)) {
    throw new Error(
      "[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_CONSTRAINTS_INVALID]",
    );
  }

  return value.map((constraint, index) => decodeConstraint(constraint, index));
}

export function decodeTransferCapacityAssessmentSnapshot(
  snapshot: unknown,
): TransferCapacityAssessment {
  assertRecord(
    snapshot,
    "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_INVALID",
  );

  const metadata = snapshot.metadata;

  assertRecord(
    metadata,
    "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_METADATA_INVALID",
  );

  return {
    id: requireString(
      snapshot,
      "id",
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    transferId: requireString(
      snapshot,
      "transferId",
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    requestedAmount: decodeMoney(
      snapshot.requestedAmount,
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_INVALID",
    ),

    constraints: decodeConstraints(snapshot.constraints),

    executableNow: decodeOptionalMoney(
      snapshot.executableNow,
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_EXECUTABLE_NOW_INVALID",
    ),

    assessedByActorId: requireString(
      snapshot,
      "assessedByActorId",
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    assessedAt: requireDate(
      snapshot,
      "assessedAt",
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    notes: optionalString(
      snapshot,
      "notes",
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    metadata: {
      createdAt: requireDate(
        metadata,
        "createdAt",
        "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_METADATA_INVALID",
      ),

      updatedAt: requireDate(
        metadata,
        "updatedAt",
        "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_METADATA_INVALID",
      ),

      createdByActorId: requireString(
        metadata,
        "createdByActorId",
        "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_METADATA_INVALID",
      ),

      lastModifiedByActorId: requireString(
        metadata,
        "lastModifiedByActorId",
        "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_METADATA_INVALID",
      ),

      version: requireNumber(
        metadata,
        "version",
        "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_METADATA_INVALID",
      ),
    },
  };
}
