import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import { decodeTreasuryExecutionAuthorizationEvidence } from "./decodeTreasuryExecutionAuthorizationEvidence";

import type { TreasuryExecutionId } from "../../shared/identifiers";

import type { LoadedTreasuryExecutionAuthorizationEvidence } from "./contracts";

export async function loadTreasuryExecutionAuthorizationEvidenceWithClient(params: {
  executionId: TreasuryExecutionId;

  executionVersion: number;

  client: TransactionClient;
}): Promise<LoadedTreasuryExecutionAuthorizationEvidence | null> {
  const { executionId, executionVersion, client } = params;

  const event = await client.treasuryGatewayEvent.findUnique({
    where: {
      aggregateType_aggregateId_aggregateVersion: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,

        aggregateVersion: executionVersion,
      },
    },

    select: {
      eventId: true,

      aggregateVersion: true,

      eventType: true,

      payload: true,
    },
  });

  if (!event) {
    return null;
  }

  if (event.eventType !== TREASURY_EVENT_TYPE.TREASURY_EXECUTION_AUTHORIZED) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_EVENT_TYPE_MISMATCH] ${event.eventType}`,
    );
  }

  return decodeTreasuryExecutionAuthorizationEvidence({
    payload: event.payload,

    eventId: event.eventId,

    aggregateVersion: event.aggregateVersion,

    executionId,
  });
}
