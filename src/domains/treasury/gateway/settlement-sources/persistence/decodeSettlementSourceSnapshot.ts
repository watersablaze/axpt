import {
  getAddress,
  isAddress,
} from "viem";

import {
  SETTLEMENT_SOURCE_KIND,
  type EvmAccountSettlementSourceCoordinates,
  type SettlementSource,
  type SettlementSourceKind,
} from "../contracts";

import {
  SETTLEMENT_SOURCE_STATUS,
  type SettlementSourceStatus,
} from "../status";

type JsonRecord =
  Record<string, unknown>;

function assertRecord(
  value: unknown,
  code: string,
): asserts value is JsonRecord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(`[${code}]`);
  }
}

function requireString(
  record: JsonRecord,
  key: string,
  code: string,
): string {
  const value = record[key];

  if (
    typeof value !== "string" ||
    value.length === 0
  ) {
    throw new Error(
      `[${code}] ${key}`,
    );
  }

  return value;
}

function requireInteger(
  record: JsonRecord,
  key: string,
  code: string,
): number {
  const value = record[key];

  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value)
  ) {
    throw new Error(
      `[${code}] ${key}`,
    );
  }

  return value;
}

function requireDate(
  record: JsonRecord,
  key: string,
  code: string,
): Date {
  const value =
    requireString(
      record,
      key,
      code,
    );

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `[${code}] ${key}`,
    );
  }

  return date;
}

function decodeCoordinates(
  value: unknown,
): EvmAccountSettlementSourceCoordinates {
  assertRecord(
    value,
    "TREASURY_GATEWAY_SETTLEMENT_SOURCE_COORDINATES_INVALID",
  );

  const kind =
    requireString(
      value,
      "kind",
      "TREASURY_GATEWAY_SETTLEMENT_SOURCE_KIND_INVALID",
    );

  if (
    kind !==
    SETTLEMENT_SOURCE_KIND.EVM_ACCOUNT
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_SOURCE_KIND_INVALID] ${kind}`,
    );
  }

  const chainId =
    requireInteger(
      value,
      "chainId",
      "TREASURY_GATEWAY_SETTLEMENT_SOURCE_CHAIN_ID_INVALID",
    );

  if (chainId <= 0) {
    throw new Error(
      "[TREASURY_GATEWAY_SETTLEMENT_SOURCE_CHAIN_ID_INVALID]",
    );
  }

  const address =
    requireString(
      value,
      "address",
      "TREASURY_GATEWAY_SETTLEMENT_SOURCE_ADDRESS_INVALID",
    );

  if (!isAddress(address)) {
    throw new Error(
      "[TREASURY_GATEWAY_SETTLEMENT_SOURCE_ADDRESS_INVALID]",
    );
  }

  return {
    kind:
      SETTLEMENT_SOURCE_KIND.EVM_ACCOUNT,

    chainId,

    network:
      requireString(
        value,
        "network",
        "TREASURY_GATEWAY_SETTLEMENT_SOURCE_NETWORK_INVALID",
      ),

    address:
      getAddress(address),
  };
}

export function decodeSettlementSourceSnapshot(
  snapshot: unknown,
): SettlementSource {
  assertRecord(
    snapshot,
    "TREASURY_GATEWAY_SETTLEMENT_SOURCE_SNAPSHOT_INVALID",
  );

  const metadata =
    snapshot.metadata;

  assertRecord(
    metadata,
    "TREASURY_GATEWAY_SETTLEMENT_SOURCE_METADATA_INVALID",
  );

  const kind =
    requireString(
      snapshot,
      "kind",
      "TREASURY_GATEWAY_SETTLEMENT_SOURCE_KIND_INVALID",
    );

  if (
    !Object.values(
      SETTLEMENT_SOURCE_KIND,
    ).includes(
      kind as SettlementSourceKind,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_SOURCE_KIND_INVALID] ${kind}`,
    );
  }

  const status =
    requireString(
      snapshot,
      "status",
      "TREASURY_GATEWAY_SETTLEMENT_SOURCE_STATUS_INVALID",
    );

  if (
    !Object.values(
      SETTLEMENT_SOURCE_STATUS,
    ).includes(
      status as SettlementSourceStatus,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_SOURCE_STATUS_INVALID] ${status}`,
    );
  }

  const coordinates =
    decodeCoordinates(
      snapshot.coordinates,
    );

  if (coordinates.kind !== kind) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_SOURCE_COORDINATE_KIND_MISMATCH] ${coordinates.kind} -> ${kind}`,
    );
  }

  return {
    id:
      requireString(
        snapshot,
        "id",
        "TREASURY_GATEWAY_SETTLEMENT_SOURCE_SNAPSHOT_INVALID",
      ),

    reference:
      requireString(
        snapshot,
        "reference",
        "TREASURY_GATEWAY_SETTLEMENT_SOURCE_SNAPSHOT_INVALID",
      ),

    kind:
      kind as SettlementSourceKind,

    coordinates,

    status:
      status as SettlementSourceStatus,

    metadata: {
      createdAt:
        requireDate(
          metadata,
          "createdAt",
          "TREASURY_GATEWAY_SETTLEMENT_SOURCE_METADATA_INVALID",
        ),

      updatedAt:
        requireDate(
          metadata,
          "updatedAt",
          "TREASURY_GATEWAY_SETTLEMENT_SOURCE_METADATA_INVALID",
        ),

      createdByActorId:
        requireString(
          metadata,
          "createdByActorId",
          "TREASURY_GATEWAY_SETTLEMENT_SOURCE_METADATA_INVALID",
        ),

      lastModifiedByActorId:
        requireString(
          metadata,
          "lastModifiedByActorId",
          "TREASURY_GATEWAY_SETTLEMENT_SOURCE_METADATA_INVALID",
        ),

      version:
        requireInteger(
          metadata,
          "version",
          "TREASURY_GATEWAY_SETTLEMENT_SOURCE_METADATA_INVALID",
        ),
    },
  };
}
