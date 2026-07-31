import {
  TREASURY_TRANSFER_LOCATION_KIND,
  type TreasuryTransfer,
  type TreasuryTransferLocation,
} from "../contracts";

import { TREASURY_TRANSFER_STATUS } from "../status";

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

function decodeMoney(value: unknown) {
  assertRecord(value, "TREASURY_GATEWAY_TRANSFER_AMOUNT_INVALID");

  return {
    amount: requireString(
      value,
      "amount",
      "TREASURY_GATEWAY_TRANSFER_AMOUNT_INVALID",
    ),

    currency: requireString(
      value,
      "currency",
      "TREASURY_GATEWAY_TRANSFER_AMOUNT_INVALID",
    ),
  };
}

function decodeTransferLocation(
  value: unknown,
  field: "source" | "destination",
): TreasuryTransferLocation {
  const code = `TREASURY_GATEWAY_TRANSFER_${field.toUpperCase()}_INVALID`;

  assertRecord(value, code);

  const kind = requireString(value, "kind", code);

  switch (kind) {
    case TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT:
      return {
        kind,

        programAccountId: requireString(value, "programAccountId", code),
      };

    case TREASURY_TRANSFER_LOCATION_KIND.TREASURY_PARTY:
      return {
        kind,

        treasuryPartyId: requireString(value, "treasuryPartyId", code),
      };

    case TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT:
      return {
        kind,

        settlementEndpointId: requireString(
          value,
          "settlementEndpointId",
          code,
        ),
      };

    case TREASURY_TRANSFER_LOCATION_KIND.EXTERNAL_REFERENCE:
      return {
        kind,

        externalReference: requireString(value, "externalReference", code),
      };

    case TREASURY_TRANSFER_LOCATION_KIND.OTHER:
      return {
        kind,

        reference: requireString(value, "reference", code),
      };

    default:
      throw new Error(`[${code}] ${kind}`);
  }
}

export function decodeTreasuryTransferSnapshot(
  snapshot: unknown,
): TreasuryTransfer {
  assertRecord(snapshot, "TREASURY_GATEWAY_TRANSFER_SNAPSHOT_INVALID");

  const metadata = snapshot.metadata;

  assertRecord(metadata, "TREASURY_GATEWAY_TRANSFER_METADATA_INVALID");

  const status = requireString(
    snapshot,
    "status",
    "TREASURY_GATEWAY_TRANSFER_STATUS_INVALID",
  );

  if (
    !Object.values(TREASURY_TRANSFER_STATUS).includes(
      status as TreasuryTransfer["status"],
    )
  ) {
    throw new Error(`[TREASURY_GATEWAY_TRANSFER_STATUS_INVALID] ${status}`);
  }

  return {
    id: requireString(
      snapshot,
      "id",
      "TREASURY_GATEWAY_TRANSFER_SNAPSHOT_INVALID",
    ),

    reference: requireString(
      snapshot,
      "reference",
      "TREASURY_GATEWAY_TRANSFER_SNAPSHOT_INVALID",
    ),

    programId: requireString(
      snapshot,
      "programId",
      "TREASURY_GATEWAY_TRANSFER_SNAPSHOT_INVALID",
    ),

    instructionId: optionalString(
      snapshot,
      "instructionId",
      "TREASURY_GATEWAY_TRANSFER_SNAPSHOT_INVALID",
    ),

    source: decodeTransferLocation(snapshot.source, "source"),

    destination: decodeTransferLocation(snapshot.destination, "destination"),

    requestedAmount: decodeMoney(snapshot.requestedAmount),

    destinationCurrency: requireString(
      snapshot,
      "destinationCurrency",
      "TREASURY_GATEWAY_TRANSFER_SNAPSHOT_INVALID",
    ),

    purpose: requireString(
      snapshot,
      "purpose",
      "TREASURY_GATEWAY_TRANSFER_SNAPSHOT_INVALID",
    ),

    status: status as TreasuryTransfer["status"],

    metadata: {
      createdAt: requireDate(
        metadata,
        "createdAt",
        "TREASURY_GATEWAY_TRANSFER_METADATA_INVALID",
      ),

      updatedAt: requireDate(
        metadata,
        "updatedAt",
        "TREASURY_GATEWAY_TRANSFER_METADATA_INVALID",
      ),

      createdByActorId: requireString(
        metadata,
        "createdByActorId",
        "TREASURY_GATEWAY_TRANSFER_METADATA_INVALID",
      ),

      lastModifiedByActorId: requireString(
        metadata,
        "lastModifiedByActorId",
        "TREASURY_GATEWAY_TRANSFER_METADATA_INVALID",
      ),

      version: requireNumber(
        metadata,
        "version",
        "TREASURY_GATEWAY_TRANSFER_METADATA_INVALID",
      ),
    },
  };
}
