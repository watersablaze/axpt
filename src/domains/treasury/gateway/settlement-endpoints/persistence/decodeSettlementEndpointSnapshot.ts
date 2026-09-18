import {
  getAddress,
  isAddress,
} from "viem";

import {
  SETTLEMENT_ENDPOINT_KIND,
  type EvmErc20SettlementCoordinates,
  type SettlementEndpoint,
  type SettlementEndpointKind,
} from "../contracts";

import {
  SETTLEMENT_ENDPOINT_STATUS,
  type SettlementEndpointStatus,
} from "../status";

type JsonRecord = Record<string, unknown>;

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
    throw new Error(`[${code}] ${key}`);
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
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

function requireDate(
  record: JsonRecord,
  key: string,
  code: string,
): Date {
  const value = requireString(
    record,
    key,
    code,
  );

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`[${code}] ${key}`);
  }

  return date;
}

function decodeCoordinates(
  value: unknown,
): EvmErc20SettlementCoordinates {
  assertRecord(
    value,
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_COORDINATES_INVALID",
  );

  const kind = requireString(
    value,
    "kind",
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_KIND_INVALID",
  );

  if (kind !== SETTLEMENT_ENDPOINT_KIND.EVM_ERC20) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_KIND_INVALID] ${kind}`,
    );
  }

  const chainId = requireInteger(
    value,
    "chainId",
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_CHAIN_ID_INVALID",
  );

  if (chainId <= 0) {
    throw new Error(
      "[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_CHAIN_ID_INVALID]",
    );
  }

  const tokenDecimals = requireInteger(
    value,
    "tokenDecimals",
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_TOKEN_DECIMALS_INVALID",
  );

  if (tokenDecimals < 0) {
    throw new Error(
      "[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_TOKEN_DECIMALS_INVALID]",
    );
  }

  const address = requireString(
    value,
    "address",
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_ADDRESS_INVALID",
  );

  if (!isAddress(address)) {
    throw new Error(
      "[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_ADDRESS_INVALID]",
    );
  }

  const tokenContractAddress = requireString(
    value,
    "tokenContractAddress",
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_TOKEN_CONTRACT_INVALID",
  );

  if (!isAddress(tokenContractAddress)) {
    throw new Error(
      "[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_TOKEN_CONTRACT_INVALID]",
    );
  }

  return {
    kind: SETTLEMENT_ENDPOINT_KIND.EVM_ERC20,

    chainId,

    network: requireString(
      value,
      "network",
      "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_NETWORK_INVALID",
    ),

    address: getAddress(address),

    assetCode: requireString(
      value,
      "assetCode",
      "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_ASSET_INVALID",
    ),

    tokenContractAddress:
      getAddress(tokenContractAddress),

    tokenDecimals,
  };
}

export function decodeSettlementEndpointSnapshot(
  snapshot: unknown,
): SettlementEndpoint {
  assertRecord(
    snapshot,
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_SNAPSHOT_INVALID",
  );

  const metadata = snapshot.metadata;

  assertRecord(
    metadata,
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_METADATA_INVALID",
  );

  const kind = requireString(
    snapshot,
    "kind",
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_KIND_INVALID",
  );

  if (
    !Object.values(SETTLEMENT_ENDPOINT_KIND).includes(
      kind as SettlementEndpointKind,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_KIND_INVALID] ${kind}`,
    );
  }

  const status = requireString(
    snapshot,
    "status",
    "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_STATUS_INVALID",
  );

  if (
    !Object.values(SETTLEMENT_ENDPOINT_STATUS).includes(
      status as SettlementEndpointStatus,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_STATUS_INVALID] ${status}`,
    );
  }

  const coordinates = decodeCoordinates(
    snapshot.coordinates,
  );

  if (coordinates.kind !== kind) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_COORDINATE_KIND_MISMATCH] ${coordinates.kind} -> ${kind}`,
    );
  }

  return {
    id: requireString(
      snapshot,
      "id",
      "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_SNAPSHOT_INVALID",
    ),

    reference: requireString(
      snapshot,
      "reference",
      "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_SNAPSHOT_INVALID",
    ),

    kind: kind as SettlementEndpointKind,

    coordinates,

    status: status as SettlementEndpointStatus,

    metadata: {
      createdAt: requireDate(
        metadata,
        "createdAt",
        "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_METADATA_INVALID",
      ),

      updatedAt: requireDate(
        metadata,
        "updatedAt",
        "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_METADATA_INVALID",
      ),

      createdByActorId: requireString(
        metadata,
        "createdByActorId",
        "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_METADATA_INVALID",
      ),

      lastModifiedByActorId: requireString(
        metadata,
        "lastModifiedByActorId",
        "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_METADATA_INVALID",
      ),

      version: requireInteger(
        metadata,
        "version",
        "TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_METADATA_INVALID",
      ),
    },
  };
}
