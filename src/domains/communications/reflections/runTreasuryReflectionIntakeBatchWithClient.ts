import {
  classifyTreasuryReflectionIntakeEvent,
  TREASURY_REFLECTION_INTAKE_DISPOSITION,
  type TreasuryReflectionIntakeDisposition,
} from "./classifyTreasuryReflectionIntakeEvent";

import { getOrInitializeTreasuryReflectionCursorWithClient } from "./getOrInitializeTreasuryReflectionCursorWithClient";

import { loadTreasuryReflectionIntakeBatchWithClient } from "./loadTreasuryReflectionIntakeBatchWithClient";

import { projectTreasuryGatewayEventReflectionsWithClient } from "./projectTreasuryGatewayEventReflectionsWithClient";

import { COMMUNICATION_REFLECTION_SOURCE_SYSTEM } from "./reflectionVocabulary";

import type {
  CommunicationsDatabaseClient,
  CommunicationsTransactionClient,
} from "../shared/databaseTypes";

export const TREASURY_REFLECTION_INTAKE_ITEM_STATUS = {
  REFLECTED: "REFLECTED",

  SKIPPED: "SKIPPED",

  ALREADY_EXAMINED: "ALREADY_EXAMINED",
} as const;

export type TreasuryReflectionIntakeItemStatus =
  (typeof TREASURY_REFLECTION_INTAKE_ITEM_STATUS)[keyof typeof TREASURY_REFLECTION_INTAKE_ITEM_STATUS];

export type TreasuryReflectionIntakeBatchItem = Readonly<{
  sequence: bigint;

  eventId: string;

  disposition: TreasuryReflectionIntakeDisposition;

  status: TreasuryReflectionIntakeItemStatus;

  eligibleRoomCount: number;

  createdReflectionCount: number;
}>;

export type TreasuryReflectionIntakeBatchResult = Readonly<{
  startSequence: bigint;

  endSequence: bigint;

  discovered: number;

  examined: number;

  reflected: number;

  skipped: number;

  alreadyExamined: number;

  createdReflections: number;

  items: readonly TreasuryReflectionIntakeBatchItem[];
}>;

type ProjectTreasuryGatewayEventReflections =
  typeof projectTreasuryGatewayEventReflectionsWithClient;

export async function runTreasuryReflectionIntakeBatchWithDependencies({
  client,
  limit,
  projectEvent,
}: {
  client: CommunicationsDatabaseClient;

  limit?: number;

  projectEvent: ProjectTreasuryGatewayEventReflections;
}): Promise<TreasuryReflectionIntakeBatchResult> {
  const sourceSystem = COMMUNICATION_REFLECTION_SOURCE_SYSTEM.TREASURY_GATEWAY;

  const startCursor = await getOrInitializeTreasuryReflectionCursorWithClient({
    client,
  });

  const batch = await loadTreasuryReflectionIntakeBatchWithClient({
    client,
    afterSequence: startCursor.lastSequence,
    limit,
  });

  const items: TreasuryReflectionIntakeBatchItem[] = [];

  for (const event of batch.events) {
    const item = await client.$transaction(
      async (transaction): Promise<TreasuryReflectionIntakeBatchItem> => {
        const tx = transaction as CommunicationsTransactionClient;

        const currentCursor =
          await tx.communicationReflectionIntakeCursor.findUnique({
            where: {
              sourceSystem,
            },
          });

        if (!currentCursor) {
          throw new Error("COMMUNICATION_TREASURY_REFLECTION_CURSOR_NOT_FOUND");
        }

        const classification = classifyTreasuryReflectionIntakeEvent({
          aggregateType: event.aggregateType,

          eventType: event.eventType,
        });

        /*
         * Another intake runner may already have moved
         * beyond this exact source event.
         *
         * Never move a Communications cursor backward.
         */
        if (currentCursor.lastSequence >= event.sequence) {
          return {
            sequence: event.sequence,

            eventId: event.eventId,

            disposition: classification.disposition,

            status: TREASURY_REFLECTION_INTAKE_ITEM_STATUS.ALREADY_EXAMINED,

            eligibleRoomCount: 0,

            createdReflectionCount: 0,
          };
        }

        let eligibleRoomCount = 0;

        let createdReflectionCount = 0;

        if (
          classification.disposition ===
          TREASURY_REFLECTION_INTAKE_DISPOSITION.REFLECT
        ) {
          /*
           * Projection and cursor movement share this
           * transaction. A projector failure therefore
           * prevents checkpoint advancement.
           */
          const projection = await projectEvent({
            sourceEventId: event.eventId,

            client: tx,
          });

          eligibleRoomCount = projection.eligibleRoomCount;

          createdReflectionCount = projection.createdCount;
        }

        /*
         * Advance monotonically.
         *
         * The predicate prevents a slower concurrent
         * runner from moving the cursor backward after
         * another runner has advanced farther.
         */
        const advanced =
          await tx.communicationReflectionIntakeCursor.updateMany({
            where: {
              sourceSystem,

              lastSequence: {
                lt: event.sequence,
              },
            },

            data: {
              lastSequence: event.sequence,

              lastEventId: event.eventId,
            },
          });

        if (advanced.count === 0) {
          const durableCursor =
            await tx.communicationReflectionIntakeCursor.findUnique({
              where: {
                sourceSystem,
              },

              select: {
                lastSequence: true,
              },
            });

          if (!durableCursor || durableCursor.lastSequence < event.sequence) {
            throw new Error(
              "COMMUNICATION_TREASURY_REFLECTION_CURSOR_ADVANCE_FAILED",
            );
          }
        }

        return {
          sequence: event.sequence,

          eventId: event.eventId,

          disposition: classification.disposition,

          status:
            classification.disposition ===
            TREASURY_REFLECTION_INTAKE_DISPOSITION.REFLECT
              ? TREASURY_REFLECTION_INTAKE_ITEM_STATUS.REFLECTED
              : TREASURY_REFLECTION_INTAKE_ITEM_STATUS.SKIPPED,

          eligibleRoomCount,

          createdReflectionCount,
        };
      },
    );

    items.push(item);
  }

  const endCursor = await client.communicationReflectionIntakeCursor.findUnique(
    {
      where: {
        sourceSystem,
      },

      select: {
        lastSequence: true,
      },
    },
  );

  if (!endCursor) {
    throw new Error("COMMUNICATION_TREASURY_REFLECTION_CURSOR_NOT_FOUND");
  }

  const reflected = items.filter(
    (item) => item.status === TREASURY_REFLECTION_INTAKE_ITEM_STATUS.REFLECTED,
  ).length;

  const skipped = items.filter(
    (item) => item.status === TREASURY_REFLECTION_INTAKE_ITEM_STATUS.SKIPPED,
  ).length;

  const alreadyExamined = items.filter(
    (item) =>
      item.status === TREASURY_REFLECTION_INTAKE_ITEM_STATUS.ALREADY_EXAMINED,
  ).length;

  return {
    startSequence: startCursor.lastSequence,

    endSequence: endCursor.lastSequence,

    discovered: batch.events.length,

    examined: items.length,

    reflected,

    skipped,

    alreadyExamined,

    createdReflections: items.reduce(
      (total, item) => total + item.createdReflectionCount,
      0,
    ),

    items,
  };
}

export async function runTreasuryReflectionIntakeBatchWithClient({
  client,
  limit,
}: {
  client: CommunicationsDatabaseClient;

  limit?: number;
}): Promise<TreasuryReflectionIntakeBatchResult> {
  return runTreasuryReflectionIntakeBatchWithDependencies({
    client,
    limit,
    projectEvent: projectTreasuryGatewayEventReflectionsWithClient,
  });
}
