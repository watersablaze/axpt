import { PrismaClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { COMMUNICATION_REFLECTION_SOURCE_SYSTEM } from "../../src/domains/communications/reflections/reflectionVocabulary";

import { loadTreasuryReflectionIntakeBatchWithClient } from "../../src/domains/communications/reflections/loadTreasuryReflectionIntakeBatchWithClient";

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

  const aggregateIds = [
    `reflection-loader-a-${nonce}`,
    `reflection-loader-b-${nonce}`,
    `reflection-loader-c-${nonce}`,
  ];

  const eventIds = [
    `reflection-loader-event-a-${nonce}`,
    `reflection-loader-event-b-${nonce}`,
    `reflection-loader-event-c-${nonce}`,
  ];

  try {
    /*
     * Establish a stable boundary without touching
     * any existing Treasury history.
     */
    const highWater = await prisma.treasuryGatewayEvent.findFirst({
      orderBy: {
        sequence: "desc",
      },

      select: {
        sequence: true,

        eventId: true,
      },
    });

    const boundarySequence = highWater?.sequence ?? 0n;

    await prisma.communicationReflectionIntakeCursor.upsert({
      where: {
        sourceSystem,
      },

      create: {
        sourceSystem,

        lastSequence: boundarySequence,

        lastEventId: highWater?.eventId ?? null,
      },

      update: {
        lastSequence: boundarySequence,

        lastEventId: highWater?.eventId ?? null,
      },
    });

    const cursorBefore =
      await prisma.communicationReflectionIntakeCursor.findUniqueOrThrow({
        where: {
          sourceSystem,
        },
      });

    /*
     * Create three authoritative Treasury events strictly
     * after the captured boundary.
     */
    for (let index = 0; index < aggregateIds.length; index += 1) {
      const aggregateId = aggregateIds[index];

      const eventId = eventIds[index];

      assert(
        aggregateId !== undefined && eventId !== undefined,
        "TREASURY_REFLECTION_LOADER_FIXTURE_ID_MISSING",
      );

      await prisma.treasuryGatewayAggregate.create({
        data: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

          aggregateId,

          version: 1,

          status: "APPROVED",

          snapshot: {
            id: aggregateId,

            status: "APPROVED",

            ordinal: index + 1,
          },
        },
      });

      await prisma.treasuryGatewayEvent.create({
        data: {
          eventId,

          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

          aggregateId,

          aggregateVersion: 1,

          eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,

          correlationId: `reflection-loader-${nonce}-${index + 1}`,

          payload: {
            instructionId: aggregateId,

            approvalIds: [`approval-${nonce}-${index + 1}`],
          },

          occurredAt: new Date(Date.now() + index),
        },
      });
    }

    const fixtures = await prisma.treasuryGatewayEvent.findMany({
      where: {
        eventId: {
          in: eventIds,
        },
      },

      orderBy: {
        sequence: "asc",
      },

      select: {
        sequence: true,

        eventId: true,

        aggregateType: true,

        aggregateId: true,

        eventType: true,

        occurredAt: true,
      },
    });

    assert(
      fixtures.length === 3,
      "TREASURY_REFLECTION_LOADER_FIXTURE_CARDINALITY_INVALID",
    );

    /*
     * 1. Exclusive boundary:
     * only events with sequence > afterSequence.
     */
    const allAfterBoundary = await loadTreasuryReflectionIntakeBatchWithClient({
      client,

      afterSequence: boundarySequence,

      limit: 10,
    });

    const loadedFixtureEvents = allAfterBoundary.events.filter((event) =>
      eventIds.includes(event.eventId),
    );

    assert(
      loadedFixtureEvents.length === 3,
      "TREASURY_REFLECTION_LOADER_EXCLUSIVE_BOUNDARY_INVALID",
    );

    /*
     * 2. Exact ascending sequence order.
     */
    for (let index = 1; index < loadedFixtureEvents.length; index += 1) {
      const previous = loadedFixtureEvents[index - 1];

      const current = loadedFixtureEvents[index];

      assert(
        previous !== undefined &&
          current !== undefined &&
          previous.sequence < current.sequence,
        "TREASURY_REFLECTION_LOADER_ORDER_INVALID",
      );
    }

    assert(
      loadedFixtureEvents.map((event) => event.eventId).join("|") ===
        eventIds.join("|"),
      "TREASURY_REFLECTION_LOADER_EVENT_ORDER_INVALID",
    );

    /*
     * 3. Limit is enforced deterministically.
     */
    const limited = await loadTreasuryReflectionIntakeBatchWithClient({
      client,

      afterSequence: boundarySequence,

      limit: 2,
    });

    assert(
      limited.events.length === 2,
      "TREASURY_REFLECTION_LOADER_LIMIT_NOT_ENFORCED",
    );

    assert(
      limited.events[0]?.eventId === eventIds[0] &&
        limited.events[1]?.eventId === eventIds[1],
      "TREASURY_REFLECTION_LOADER_LIMIT_ORDER_INVALID",
    );

    /*
     * 4. Advancing only the query boundary, not the durable
     * cursor, yields the remaining tail.
     */
    const firstFixture = fixtures[0];

    assert(
      firstFixture !== undefined,
      "TREASURY_REFLECTION_LOADER_FIRST_FIXTURE_MISSING",
    );

    const tail = await loadTreasuryReflectionIntakeBatchWithClient({
      client,

      afterSequence: firstFixture.sequence,

      limit: 10,
    });

    const tailFixtureEvents = tail.events.filter((event) =>
      eventIds.includes(event.eventId),
    );

    assert(
      tailFixtureEvents.length === 2 &&
        tailFixtureEvents[0]?.eventId === eventIds[1] &&
        tailFixtureEvents[1]?.eventId === eventIds[2],
      "TREASURY_REFLECTION_LOADER_TAIL_INVALID",
    );

    /*
     * 5. Query after the last fixture produces no fixture
     * events and establishes empty-tail behavior.
     */
    const lastFixture = fixtures[fixtures.length - 1];

    assert(
      lastFixture !== undefined,
      "TREASURY_REFLECTION_LOADER_LAST_FIXTURE_MISSING",
    );

    const emptyTail = await loadTreasuryReflectionIntakeBatchWithClient({
      client,

      afterSequence: lastFixture.sequence,

      limit: 10,
    });

    assert(
      !emptyTail.events.some((event) => eventIds.includes(event.eventId)),
      "TREASURY_REFLECTION_LOADER_EMPTY_TAIL_INVALID",
    );

    /*
     * 6. Loader must not mutate the durable cursor.
     */
    const cursorAfter =
      await prisma.communicationReflectionIntakeCursor.findUniqueOrThrow({
        where: {
          sourceSystem,
        },
      });

    assert(
      cursorAfter.lastSequence === cursorBefore.lastSequence &&
        cursorAfter.lastEventId === cursorBefore.lastEventId &&
        cursorAfter.updatedAt.getTime() === cursorBefore.updatedAt.getTime(),
      "TREASURY_REFLECTION_LOADER_MUTATED_CURSOR",
    );

    /*
     * 7. Loader must not mutate authoritative Treasury rows.
     */
    const fixturesAfter = await prisma.treasuryGatewayEvent.findMany({
      where: {
        eventId: {
          in: eventIds,
        },
      },

      orderBy: {
        sequence: "asc",
      },
    });

    assert(
      fixturesAfter.length === 3,
      "TREASURY_REFLECTION_LOADER_MUTATED_TREASURY_EVENTS",
    );

    /*
     * 8. Invalid boundaries and limits are rejected before
     * any database mutation can occur.
     */
    let negativeSequenceBlocked = false;

    try {
      await loadTreasuryReflectionIntakeBatchWithClient({
        client,

        afterSequence: -1n,
      });
    } catch (error: unknown) {
      negativeSequenceBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_TREASURY_REFLECTION_INTAKE_SEQUENCE_INVALID";
    }

    assert(
      negativeSequenceBlocked,
      "TREASURY_REFLECTION_LOADER_NEGATIVE_SEQUENCE_NOT_BLOCKED",
    );

    let invalidLimitBlocked = false;

    try {
      await loadTreasuryReflectionIntakeBatchWithClient({
        client,

        afterSequence: boundarySequence,

        limit: 0,
      });
    } catch (error: unknown) {
      invalidLimitBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_TREASURY_REFLECTION_INTAKE_LIMIT_INVALID";
    }

    assert(
      invalidLimitBlocked,
      "TREASURY_REFLECTION_LOADER_INVALID_LIMIT_NOT_BLOCKED",
    );

    console.log({
      exclusiveSequenceBoundary: true,

      ascendingSequenceOrder: true,

      deterministicLimit: true,

      orderedTail: true,

      emptyTail: true,

      cursorUnchanged: true,

      treasuryLedgerUnchanged: true,

      invalidBoundaryBlocked: true,

      invalidLimitBlocked: true,
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        eventId: {
          in: eventIds,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: {
          in: aggregateIds,
        },
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
