import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import type { TreasuryTransferId } from "../../shared/identifiers";

import { decodeTreasuryTransferPlanningEvidence } from "./decodeTreasuryTransferPlanningEvidence";

import type { LoadedTreasuryTransferPlanningEvidence } from "./contracts";

export async function loadTreasuryTransferPlanningEvidenceWithClient(params: {
  transferId: TreasuryTransferId;

  transferVersion: number;

  client: TransactionClient;
}): Promise<LoadedTreasuryTransferPlanningEvidence | null> {
  const { transferId, transferVersion, client } = params;

  if (!Number.isInteger(transferVersion) || transferVersion <= 0) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_VERSION_INVALID] ${transferVersion}`,
    );
  }

  const event = await client.treasuryGatewayEvent.findFirst({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

      aggregateId: transferId,

      aggregateVersion: {
        lte: transferVersion,
      },

      eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,
    },

    orderBy: {
      aggregateVersion: "desc",
    },

    select: {
      eventId: true,

      aggregateVersion: true,

      payload: true,
    },
  });

  if (!event) {
    return null;
  }

  return decodeTreasuryTransferPlanningEvidence({
    payload: event.payload,

    eventId: event.eventId,

    aggregateVersion: event.aggregateVersion,

    transferId,
  });
}
