import type {
  TransactionClient,
} from "@prisma/client";

import {
  registerSettlementEndpoint,
} from "../registerSettlementEndpoint";

import {
  persistNewSettlementEndpointWithClient,
} from "../persistence/persistNewSettlementEndpointWithClient";

import type {
  PersistedNewSettlementEndpoint,
} from "../persistence/contracts";

import type {
  RegisterSettlementEndpointDurably,
} from "./registerSettlementEndpointDurablyContracts";

export async function registerSettlementEndpointDurablyWithClient(
  params: {
    request: RegisterSettlementEndpointDurably;

    client: TransactionClient;
  },
): Promise<PersistedNewSettlementEndpoint> {
  const {
    request,
    client,
  } = params;

  const result = registerSettlementEndpoint({
    settlementEndpointId:
      request.settlementEndpointId,

    reference: request.reference,

    command: {
      context: request.context,

      payload: request.payload,
    },
  });

  return persistNewSettlementEndpointWithClient({
    result,

    eventId: request.eventId,

    context: request.context,

    client,
  });
}
