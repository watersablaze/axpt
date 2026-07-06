import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import { decodeTreasuryExecutionDispatchOwnershipEvidence } from "./decodeTreasuryExecutionDispatchOwnershipEvidence";

import type { TreasuryExecutionId } from "../../shared/identifiers";

import type { LoadedTreasuryExecutionDispatchOwnershipEvidence } from "./contracts";

export async function loadTreasuryExecutionDispatchOwnershipEvidenceWithClient(params: {
  executionId: TreasuryExecutionId;

  executionVersion: number;

  client: TransactionClient;
}): Promise<LoadedTreasuryExecutionDispatchOwnershipEvidence | null> {
  const { executionId, executionVersion, client } = params;

  if (!Number.isInteger(executionVersion) || executionVersion <= 0) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_VERSION_INVALID] ${executionVersion}`,
    );
  }

  const event = await client.treasuryGatewayEvent.findFirst({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: executionId,

      aggregateVersion: {
        lte: executionVersion,
      },

      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_QUEUED,
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

  return decodeTreasuryExecutionDispatchOwnershipEvidence({
    payload: event.payload,

    eventId: event.eventId,

    aggregateVersion: event.aggregateVersion,

    executionId,
  });
}
