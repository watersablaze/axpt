import {
  CAPITAL_RECEIPT_METHOD,
  type CapitalReceiptMethod,
  type ProgramCapitalReceipt,
} from "../contracts";

import {
  PROGRAM_CAPITAL_RECEIPT_STATUS,
  type ProgramCapitalReceiptStatus,
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

function optionalMoney(record: JsonRecord, key: string, code: string) {
  const value = record[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  return decodeMoney(value, code);
}

export function decodeProgramCapitalReceiptSnapshot(
  snapshot: unknown,
): ProgramCapitalReceipt {
  assertRecord(
    snapshot,
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_INVALID",
  );

  const metadata = snapshot.metadata;

  assertRecord(
    metadata,
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_METADATA_INVALID",
  );

  const receiptMethod = requireString(
    snapshot,
    "receiptMethod",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_METHOD_INVALID",
  );

  if (
    !Object.values(CAPITAL_RECEIPT_METHOD).includes(
      receiptMethod as CapitalReceiptMethod,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_METHOD_INVALID] ${receiptMethod}`,
    );
  }

  const status = requireString(
    snapshot,
    "status",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_STATUS_INVALID",
  );

  if (
    !Object.values(PROGRAM_CAPITAL_RECEIPT_STATUS).includes(
      status as ProgramCapitalReceiptStatus,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_STATUS_INVALID] ${status}`,
    );
  }

  const receivedFromPartyId = optionalString(
    snapshot,
    "receivedFromPartyId",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_INVALID",
  );

  const verifiedAmount = optionalMoney(
    snapshot,
    "verifiedAmount",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_VERIFIED_AMOUNT_INVALID",
  );

  const recognizedAmount = optionalMoney(
    snapshot,
    "recognizedAmount",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_RECOGNIZED_AMOUNT_INVALID",
  );

  const externalReference = optionalString(
    snapshot,
    "externalReference",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_INVALID",
  );

  const expectedAt = optionalDate(
    snapshot,
    "expectedAt",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_DATE_INVALID",
  );

  const receivedAt = optionalDate(
    snapshot,
    "receivedAt",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_DATE_INVALID",
  );

  const verifiedAt = optionalDate(
    snapshot,
    "verifiedAt",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_DATE_INVALID",
  );

  const recognizedAt = optionalDate(
    snapshot,
    "recognizedAt",
    "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_DATE_INVALID",
  );

  return {
    id: requireString(
      snapshot,
      "id",
      "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_INVALID",
    ),

    reference: requireString(
      snapshot,
      "reference",
      "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_INVALID",
    ),

    programId: requireString(
      snapshot,
      "programId",
      "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_INVALID",
    ),

    destinationProgramAccountId: requireString(
      snapshot,
      "destinationProgramAccountId",
      "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_SNAPSHOT_INVALID",
    ),

    ...(receivedFromPartyId
      ? {
          receivedFromPartyId,
        }
      : {}),

    declaredAmount: decodeMoney(
      snapshot.declaredAmount,
      "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_DECLARED_AMOUNT_INVALID",
    ),

    ...(verifiedAmount
      ? {
          verifiedAmount,
        }
      : {}),

    ...(recognizedAmount
      ? {
          recognizedAmount,
        }
      : {}),

    receiptMethod: receiptMethod as CapitalReceiptMethod,

    ...(externalReference
      ? {
          externalReference,
        }
      : {}),

    status: status as ProgramCapitalReceiptStatus,

    ...(expectedAt
      ? {
          expectedAt,
        }
      : {}),

    ...(receivedAt
      ? {
          receivedAt,
        }
      : {}),

    ...(verifiedAt
      ? {
          verifiedAt,
        }
      : {}),

    ...(recognizedAt
      ? {
          recognizedAt,
        }
      : {}),

    metadata: {
      createdAt: requireDate(
        metadata,
        "createdAt",
        "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_METADATA_INVALID",
      ),

      updatedAt: requireDate(
        metadata,
        "updatedAt",
        "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_METADATA_INVALID",
      ),

      createdByActorId: requireString(
        metadata,
        "createdByActorId",
        "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_METADATA_INVALID",
      ),

      lastModifiedByActorId: requireString(
        metadata,
        "lastModifiedByActorId",
        "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_METADATA_INVALID",
      ),

      version: requireNumber(
        metadata,
        "version",
        "TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_METADATA_INVALID",
      ),
    },
  };
}
