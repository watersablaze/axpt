import type {
  TransactionClient,
} from "@prisma/client";

import {
  registerSettlementSource,
} from "../registerSettlementSource";

import {
  persistNewSettlementSourceWithClient,
} from "../persistence/persistNewSettlementSourceWithClient";

import type {
  PersistedNewSettlementSource,
} from "../persistence/contracts";

import type {
  RegisterSettlementSourceDurably,
} from "./registerSettlementSourceDurablyContracts";

export async function registerSettlementSourceDurablyWithClient(
  params: {
    request:
      RegisterSettlementSourceDurably;

    client: TransactionClient;
  },
): Promise<
  PersistedNewSettlementSource
> {
  const {
    request,
    client,
  } = params;

  const result =
    registerSettlementSource({
      settlementSourceId:
        request.settlementSourceId,

      reference:
        request.reference,

      command: {
        context:
          request.context,

        payload:
          request.payload,
      },
    });

  return persistNewSettlementSourceWithClient({
    result,

    eventId:
      request.eventId,

    context:
      request.context,

    client,
  });
}
