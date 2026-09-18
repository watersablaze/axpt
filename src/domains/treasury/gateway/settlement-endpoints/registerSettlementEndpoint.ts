import { getAddress, isAddress } from "viem";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type {
  SettlementEndpointId,
} from "../shared/identifiers";

import type { RegisterSettlementEndpoint } from "./commands";

import {
  SETTLEMENT_ENDPOINT_KIND,
  type EvmErc20SettlementCoordinates,
  type SettlementEndpoint,
} from "./contracts";

import type { SettlementEndpointRegisteredPayload } from "./events";

import { SETTLEMENT_ENDPOINT_STATUS } from "./status";

function requireNonEmpty(
  value: string,
  code: string,
): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`[${code}]`);
  }

  return normalized;
}

function normalizeEvmErc20Coordinates(
  coordinates: EvmErc20SettlementCoordinates,
): EvmErc20SettlementCoordinates {
  if (
    !Number.isSafeInteger(coordinates.chainId) ||
    coordinates.chainId <= 0
  ) {
    throw new Error(
      "[SETTLEMENT_ENDPOINT_EVM_CHAIN_ID_INVALID]",
    );
  }

  if (
    !Number.isSafeInteger(coordinates.tokenDecimals) ||
    coordinates.tokenDecimals < 0
  ) {
    throw new Error(
      "[SETTLEMENT_ENDPOINT_TOKEN_DECIMALS_INVALID]",
    );
  }

  if (!isAddress(coordinates.address)) {
    throw new Error(
      "[SETTLEMENT_ENDPOINT_EVM_ADDRESS_INVALID]",
    );
  }

  if (!isAddress(coordinates.tokenContractAddress)) {
    throw new Error(
      "[SETTLEMENT_ENDPOINT_TOKEN_CONTRACT_INVALID]",
    );
  }

  return {
    kind: SETTLEMENT_ENDPOINT_KIND.EVM_ERC20,

    chainId: coordinates.chainId,

    network: requireNonEmpty(
      coordinates.network,
      "SETTLEMENT_ENDPOINT_NETWORK_REQUIRED",
    ),

    address: getAddress(coordinates.address),

    assetCode: requireNonEmpty(
      coordinates.assetCode,
      "SETTLEMENT_ENDPOINT_ASSET_CODE_REQUIRED",
    ).toUpperCase(),

    tokenContractAddress: getAddress(
      coordinates.tokenContractAddress,
    ),

    tokenDecimals: coordinates.tokenDecimals,
  };
}

export function registerSettlementEndpoint(params: {
  settlementEndpointId: SettlementEndpointId;

  reference: string;

  command: RegisterSettlementEndpoint;
}): TreasuryDomainResult<
  SettlementEndpoint,
  SettlementEndpointRegisteredPayload
> {
  const {
    settlementEndpointId,
    command,
  } = params;

  const reference = requireNonEmpty(
    params.reference,
    "SETTLEMENT_ENDPOINT_REFERENCE_REQUIRED",
  );

  const { context, payload } = command;

  const coordinates = normalizeEvmErc20Coordinates(
    payload.coordinates,
  );

  const now = context.requestedAt;

  const aggregate: SettlementEndpoint = {
    id: settlementEndpointId,

    reference,

    kind: coordinates.kind,

    coordinates,

    status: SETTLEMENT_ENDPOINT_STATUS.ACTIVE,

    metadata: {
      createdAt: now,

      updatedAt: now,

      createdByActorId: context.actorId,

      lastModifiedByActorId: context.actorId,

      version: 1,
    },
  };

  return {
    aggregate,

    event: {
      eventType:
        TREASURY_EVENT_TYPE.SETTLEMENT_ENDPOINT_REGISTERED,

      payload: {
        settlementEndpointId,

        reference,

        kind: coordinates.kind,

        coordinates,
      },

      occurredAt: now,
    },
  };
}
