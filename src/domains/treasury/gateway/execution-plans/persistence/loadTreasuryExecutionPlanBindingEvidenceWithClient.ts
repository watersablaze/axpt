import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import type { TreasuryExecutionId } from "../../shared/identifiers";

import {
  decodeTreasuryExecutionPlanBindingEvidence,
  type LoadedTreasuryExecutionPlanBindingEvidence,
} from "./decodeTreasuryExecutionPlanBindingEvidence";

export async function loadTreasuryExecutionPlanBindingEvidenceWithClient(params: {
  executionId: TreasuryExecutionId;

  client: TransactionClient;
}): Promise<LoadedTreasuryExecutionPlanBindingEvidence | null> {
  const { executionId, client } = params;

  const events = await client.treasuryGatewayEvent.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

      eventType:
        TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_BOUND_TO_EXECUTION,

      payload: {
        path: ["executionId"],

        equals: executionId,
      },
    },

    orderBy: {
      sequence: "asc",
    },

    take: 2,

    select: {
      eventId: true,

      aggregateId: true,

      aggregateVersion: true,

      payload: true,
    },
  });

  if (events.length === 0) {
    return null;
  }

  if (events.length !== 1) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_BINDING_CARDINALITY_VIOLATION] ${executionId} -> ${events.length}`,
    );
  }

  const [event] = events;

  return decodeTreasuryExecutionPlanBindingEvidence({
    payload: event.payload,

    eventId: event.eventId,

    aggregateId: event.aggregateId,

    aggregateVersion: event.aggregateVersion,

    executionId,
  });
}
