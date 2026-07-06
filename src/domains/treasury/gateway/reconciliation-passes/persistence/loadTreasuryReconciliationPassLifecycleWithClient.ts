import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import type { TreasuryEventType } from "../../events/eventType";

import type { LoadedTreasuryReconciliationPassLifecycle } from "./contracts";

const RECONCILIATION_PASS_EVENT_TYPES = new Set<TreasuryEventType>([
  TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED,

  TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_STARTED,

  TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_COMPLETED,

  TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_FAILED,
]);

type TreasuryGatewayReconciliationPassEventRow = Readonly<{
  eventId: string;

  sequence: bigint;

  aggregateVersion: number;

  eventType: string;

  actorId: string | null;

  authorityGrantId: string | null;

  correlationId: string;

  causationId: string | null;

  occurredAt: Date;

  recordedAt: Date;
}>;

export async function loadTreasuryReconciliationPassLifecycleWithClient(params: {
  passId: string;

  client: TransactionClient;
}): Promise<LoadedTreasuryReconciliationPassLifecycle> {
  const { passId, client } = params;

  const rows = await client.treasuryGatewayEvent.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

      aggregateId: passId,
    },

    orderBy: {
      aggregateVersion: "asc",
    },

    select: {
      eventId: true,

      sequence: true,

      aggregateVersion: true,

      eventType: true,

      actorId: true,

      authorityGrantId: true,

      correlationId: true,

      causationId: true,

      occurredAt: true,

      recordedAt: true,
    },
  });

  return {
    passId,

    events: rows.map((row: TreasuryGatewayReconciliationPassEventRow) => {
      if (
        !RECONCILIATION_PASS_EVENT_TYPES.has(row.eventType as TreasuryEventType)
      ) {
        throw new Error(
          `[TREASURY_RECONCILIATION_PASS_LIFECYCLE_EVENT_TYPE_INVALID] ${row.eventType}`,
        );
      }

      return {
        eventId: row.eventId,

        sequence: row.sequence,

        aggregateVersion: row.aggregateVersion,

        eventType: row.eventType as TreasuryEventType,

        actorId: row.actorId ?? undefined,

        authorityGrantId: row.authorityGrantId ?? undefined,

        correlationId: row.correlationId,

        causationId: row.causationId ?? undefined,

        occurredAt: row.occurredAt,

        recordedAt: row.recordedAt,
      };
    }),

    loadedAt: new Date(),
  };
}
