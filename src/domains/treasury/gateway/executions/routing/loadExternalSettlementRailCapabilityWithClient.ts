import type {
  TransactionClient,
} from "@prisma/client";

import type {
  SettlementEndpointId,
} from "../../shared/identifiers";

import {
  loadSettlementEndpointWithClient,
} from "../../settlement-endpoints/persistence/loadSettlementEndpointWithClient";

import type {
  ExternalSettlementRailCapability,
} from "./contracts";

import {
  deriveExternalSettlementRailCapability,
} from "./deriveExternalSettlementRailCapability";

export async function loadExternalSettlementRailCapabilityWithClient(
  params: {
    settlementEndpointId: SettlementEndpointId;

    client: TransactionClient;
  },
): Promise<ExternalSettlementRailCapability> {
  const {
    settlementEndpointId,
    client,
  } = params;

  const loaded =
    await loadSettlementEndpointWithClient({
      settlementEndpointId,

      client,
    });

  if (!loaded) {
    throw new Error(
      `[TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_NOT_FOUND] ${settlementEndpointId}`,
    );
  }

  return deriveExternalSettlementRailCapability(
    loaded.aggregate,
  );
}
