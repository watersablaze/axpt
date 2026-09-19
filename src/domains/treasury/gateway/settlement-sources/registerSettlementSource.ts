import {
  getAddress,
  isAddress,
} from "viem";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type {
  SettlementSourceId,
} from "../shared/identifiers";

import type { RegisterSettlementSource } from "./commands";

import {
  SETTLEMENT_SOURCE_KIND,
  type EvmAccountSettlementSourceCoordinates,
  type SettlementSource,
} from "./contracts";

import type {
  SettlementSourceRegisteredPayload,
} from "./events";

import {
  SETTLEMENT_SOURCE_STATUS,
} from "./status";

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

function normalizeEvmAccountCoordinates(
  coordinates:
    EvmAccountSettlementSourceCoordinates,
): EvmAccountSettlementSourceCoordinates {
  if (
    !Number.isSafeInteger(coordinates.chainId) ||
    coordinates.chainId <= 0
  ) {
    throw new Error(
      "[SETTLEMENT_SOURCE_EVM_CHAIN_ID_INVALID]",
    );
  }

  if (!isAddress(coordinates.address)) {
    throw new Error(
      "[SETTLEMENT_SOURCE_EVM_ADDRESS_INVALID]",
    );
  }

  return {
    kind:
      SETTLEMENT_SOURCE_KIND.EVM_ACCOUNT,

    chainId:
      coordinates.chainId,

    network:
      requireNonEmpty(
        coordinates.network,
        "SETTLEMENT_SOURCE_NETWORK_REQUIRED",
      ),

    address:
      getAddress(coordinates.address),
  };
}

export function registerSettlementSource(params: {
  settlementSourceId: SettlementSourceId;

  reference: string;

  command: RegisterSettlementSource;
}): TreasuryDomainResult<
  SettlementSource,
  SettlementSourceRegisteredPayload
> {
  const {
    settlementSourceId,
    command,
  } = params;

  const reference =
    requireNonEmpty(
      params.reference,
      "SETTLEMENT_SOURCE_REFERENCE_REQUIRED",
    );

  const { context, payload } = command;

  const coordinates =
    normalizeEvmAccountCoordinates(
      payload.coordinates,
    );

  const now = context.requestedAt;

  const aggregate: SettlementSource = {
    id: settlementSourceId,

    reference,

    kind: coordinates.kind,

    coordinates,

    status:
      SETTLEMENT_SOURCE_STATUS.ACTIVE,

    metadata: {
      createdAt: now,

      updatedAt: now,

      createdByActorId:
        context.actorId,

      lastModifiedByActorId:
        context.actorId,

      version: 1,
    },
  };

  return {
    aggregate,

    event: {
      eventType:
        TREASURY_EVENT_TYPE.SETTLEMENT_SOURCE_REGISTERED,

      payload: {
        settlementSourceId,

        reference,

        kind: coordinates.kind,

        coordinates,
      },

      occurredAt: now,
    },
  };
}
