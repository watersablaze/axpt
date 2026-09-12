import { PrismaClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { COMMUNICATION_REFLECTION_SOURCE_SYSTEM } from "../../src/domains/communications/reflections/reflectionVocabulary";

import { getOrInitializeTreasuryReflectionCursorWithClient } from "../../src/domains/communications/reflections/getOrInitializeTreasuryReflectionCursorWithClient";

import type { CommunicationsDatabaseClient } from "../../src/domains/communications/shared/databaseTypes";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const client = prisma as unknown as CommunicationsDatabaseClient;

  const sourceSystem = COMMUNICATION_REFLECTION_SOURCE_SYSTEM.TREASURY_GATEWAY;

  const futureAggregateId = `reflection-cursor-future-${nonce}`;

  const futureEventId = `reflection-cursor-future-event-${nonce}`;

  try {
    /*
     * The smoke owns only the Communications cursor row.
     * Never clear Treasury history.
     */
    await prisma.communicationReflectionIntakeCursor.deleteMany({
      where: {
        sourceSystem,
      },
    });

    /*
     * Capture the authoritative Treasury high-water mark
     * before initialization.
     */
    const highWaterBefore = await prisma.treasuryGatewayEvent.findFirst({
      orderBy: {
        sequence: "desc",
      },

      select: {
        sequence: true,

        eventId: true,
      },
    });

    const expectedSequence = highWaterBefore?.sequence ?? 0n;

    const expectedEventId = highWaterBefore?.eventId ?? null;

    /*
     * 1. First initialization must begin future-forward
     * at the current Treasury high-water mark.
     */
    const initialized = await getOrInitializeTreasuryReflectionCursorWithClient(
      {
        client,
      },
    );

    assert(
      initialized.sourceSystem === sourceSystem,
      "TREASURY_REFLECTION_CURSOR_SOURCE_SYSTEM_INVALID",
    );

    assert(
      initialized.lastSequence === expectedSequence,
      "TREASURY_REFLECTION_CURSOR_HIGH_WATER_SEQUENCE_INVALID",
    );

    assert(
      initialized.lastEventId === expectedEventId,
      "TREASURY_REFLECTION_CURSOR_HIGH_WATER_EVENT_INVALID",
    );

    /*
     * 2. Exact retry reads the same durable cursor and
     * does not move its observation boundary.
     */
    const exactRetry = await getOrInitializeTreasuryReflectionCursorWithClient({
      client,
    });

    assert(
      exactRetry.lastSequence === initialized.lastSequence,
      "TREASURY_REFLECTION_CURSOR_RETRY_SEQUENCE_CHANGED",
    );

    assert(
      exactRetry.lastEventId === initialized.lastEventId,
      "TREASURY_REFLECTION_CURSOR_RETRY_EVENT_CHANGED",
    );

    assert(
      exactRetry.initializedAt.getTime() ===
        initialized.initializedAt.getTime(),
      "TREASURY_REFLECTION_CURSOR_RETRY_REINITIALIZED",
    );

    assert(
      exactRetry.updatedAt.getTime() === initialized.updatedAt.getTime(),
      "TREASURY_REFLECTION_CURSOR_RETRY_MUTATED_ROW",
    );

    /*
     * 3. Re-establish from no cursor and prove concurrent
     * first initialization converges on one canonical row.
     */
    await prisma.communicationReflectionIntakeCursor.deleteMany({
      where: {
        sourceSystem,
      },
    });

    const highWaterBeforeConcurrent =
      await prisma.treasuryGatewayEvent.findFirst({
        orderBy: {
          sequence: "desc",
        },

        select: {
          sequence: true,

          eventId: true,
        },
      });

    const [concurrentA, concurrentB] = await Promise.all([
      getOrInitializeTreasuryReflectionCursorWithClient({
        client,
      }),

      getOrInitializeTreasuryReflectionCursorWithClient({
        client,
      }),
    ]);

    assert(
      concurrentA.lastSequence === concurrentB.lastSequence &&
        concurrentA.lastEventId === concurrentB.lastEventId,
      "TREASURY_REFLECTION_CURSOR_CONCURRENT_INITIALIZATION_DIVERGED",
    );

    assert(
      concurrentA.lastSequence === (highWaterBeforeConcurrent?.sequence ?? 0n),
      "TREASURY_REFLECTION_CURSOR_CONCURRENT_HIGH_WATER_INVALID",
    );

    assert(
      concurrentA.lastEventId === (highWaterBeforeConcurrent?.eventId ?? null),
      "TREASURY_REFLECTION_CURSOR_CONCURRENT_EVENT_INVALID",
    );

    const cursorCount = await prisma.communicationReflectionIntakeCursor.count({
      where: {
        sourceSystem,
      },
    });

    assert(
      cursorCount === 1,
      "TREASURY_REFLECTION_CURSOR_CONCURRENT_CARDINALITY_INVALID",
    );

    const durableCursor =
      await prisma.communicationReflectionIntakeCursor.findUniqueOrThrow({
        where: {
          sourceSystem,
        },
      });

    /*
     * 4. Insert an authoritative Treasury event only
     * after the cursor boundary is established.
     *
     * This event must remain ahead of the cursor and
     * therefore be discoverable by C3.2B intake.
     */
    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: futureAggregateId,

        version: 1,

        status: "APPROVED",

        snapshot: {
          id: futureAggregateId,

          status: "APPROVED",

          smoke: true,
        },
      },
    });

    const futureOccurredAt = new Date();

    const futureEvent = await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: futureEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: futureAggregateId,

        aggregateVersion: 1,

        eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,

        correlationId: `reflection-cursor-${nonce}`,

        payload: {
          instructionId: futureAggregateId,

          approvalIds: [`approval-${nonce}`],

          approvedAt: futureOccurredAt.toISOString(),
        },

        occurredAt: futureOccurredAt,
      },

      select: {
        sequence: true,

        eventId: true,
      },
    });

    assert(
      futureEvent.sequence > durableCursor.lastSequence,
      "TREASURY_REFLECTION_CURSOR_FUTURE_EVENT_NOT_AHEAD",
    );

    /*
     * Cursor initialization is not polling.
     * Adding a Treasury event must not silently advance it.
     */
    const cursorAfterFutureEvent =
      await prisma.communicationReflectionIntakeCursor.findUniqueOrThrow({
        where: {
          sourceSystem,
        },
      });

    assert(
      cursorAfterFutureEvent.lastSequence === durableCursor.lastSequence,
      "TREASURY_REFLECTION_CURSOR_ADVANCED_WITHOUT_INTAKE",
    );

    assert(
      cursorAfterFutureEvent.lastEventId === durableCursor.lastEventId,
      "TREASURY_REFLECTION_CURSOR_EVENT_CHANGED_WITHOUT_INTAKE",
    );

    /*
     * Prove the next intake query can discover the event
     * by the sequence boundary alone.
     */
    const discoverable = await prisma.treasuryGatewayEvent.findMany({
      where: {
        sequence: {
          gt: durableCursor.lastSequence,
        },
      },

      orderBy: {
        sequence: "asc",
      },

      select: {
        sequence: true,

        eventId: true,
      },
    });

    const discoveredFutureEvent = discoverable.find(
      (event: {
        sequence: bigint;
        eventId: string;
      }) => event.eventId === futureEventId,
    );

    assert(
      discoveredFutureEvent !== undefined,
      "TREASURY_REFLECTION_CURSOR_FUTURE_EVENT_NOT_DISCOVERABLE",
    );

    assert(
      discoveredFutureEvent.sequence === futureEvent.sequence,
      "TREASURY_REFLECTION_CURSOR_DISCOVERED_SEQUENCE_INVALID",
    );

    console.log({
      initializedAtCurrentHighWater: true,

      exactRetryStable: true,

      concurrentInitializationCanonical: true,

      oneCanonicalCursorRow: true,

      futureEventAheadOfCursor: true,

      cursorDoesNotAdvanceImplicitly: true,

      futureEventDiscoverableBySequence: true,
    });
  } finally {
    /*
     * Remove only smoke-owned Treasury material and
     * the Communications-owned cursor.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        eventId: futureEventId,
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: futureAggregateId,
      },
    });

    await prisma.communicationReflectionIntakeCursor.deleteMany({
      where: {
        sourceSystem,
      },
    });

    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);

  process.exitCode = 1;
});
