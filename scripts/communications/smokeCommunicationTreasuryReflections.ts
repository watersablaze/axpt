import { PrismaClient } from "@prisma/client";

import { PERMISSIONS } from "../../src/domains/auth/permissions";
import type { Principal } from "../../src/domains/auth/types";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { linkOperationalRoomTargetWithClient } from "../../src/domains/communications/operational-links/linkOperationalRoomTargetWithClient";
import { createOperationalRoomWithClient } from "../../src/domains/communications/operational-rooms/createOperationalRoomWithClient";
import { projectTreasuryGatewayEventReflectionsWithClient } from "../../src/domains/communications/reflections/projectTreasuryGatewayEventReflectionsWithClient";

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

  const conversationIds: string[] = [];
  const createdUserIds: string[] = [];

  const zeroLinkAggregateId = `reflection-zero-link-${nonce}`;

  const linkedAggregateId = `reflection-linked-${nonce}`;

  const zeroLinkEventId = `reflection-zero-link-event-${nonce}`;

  const linkedEventId = `reflection-linked-event-${nonce}`;

  const concurrentEventId = `reflection-concurrent-event-${nonce}`;

  try {
    /*
     * Resolve a real role granting Communications access.
     */
    const communicationsRole = await prisma.role.findFirst({
      where: {
        rolePermissions: {
          some: {
            permission: {
              key: PERMISSIONS.COMMUNICATIONS_ACCESS,
            },
          },
        },
      },

      select: {
        id: true,
      },
    });

    assert(communicationsRole !== null, "COMMUNICATIONS_ACCESS_ROLE_NOT_FOUND");

    const owner = await prisma.user.create({
      data: {
        username: `reflection-owner-${nonce}`,

        email: `reflection-owner-${nonce}@axpt.local`,

        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",

        viewedDocs: [],
      },
    });

    const member = await prisma.user.create({
      data: {
        username: `reflection-member-${nonce}`,

        email: `reflection-member-${nonce}@axpt.local`,

        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",

        viewedDocs: [],
      },
    });

    createdUserIds.push(owner.id, member.id);

    await prisma.userRole.create({
      data: {
        userId: member.id,

        roleId: communicationsRole.id,

        isActive: true,
      },
    });

    const ownerPrincipal: Principal = {
      userId: owner.id,

      email: owner.email,

      roles: ["ADMIN_PLATFORM"],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_GROUP_CREATE,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
        PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE,
      ],
    };

    /*
     * Establish two canonical operational rooms.
     */
    const roomA = await createOperationalRoomWithClient({
      client,

      principal: ownerPrincipal,

      clientRoomId: `reflection-room-a-${nonce}`,

      title: `Treasury Reflection A ${nonce}`,

      roomClass: "TREASURY",

      memberUserIds: [member.id],
    });

    const roomB = await createOperationalRoomWithClient({
      client,

      principal: ownerPrincipal,

      clientRoomId: `reflection-room-b-${nonce}`,

      title: `Treasury Reflection B ${nonce}`,

      roomClass: "TREASURY",

      memberUserIds: [member.id],
    });

    conversationIds.push(roomA.conversation.id, roomB.conversation.id);

    /*
     * Establish minimal authoritative Treasury source fixtures.
     *
     * Aggregate 1 remains intentionally unlinked.
     * Aggregate 2 becomes the linked reflection target.
     */
    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: zeroLinkAggregateId,

        version: 1,

        status: "SUBMITTED",

        snapshot: {
          id: zeroLinkAggregateId,

          status: "SUBMITTED",

          smoke: true,
        },
      },
    });

    await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: zeroLinkEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: zeroLinkAggregateId,

        aggregateVersion: 1,

        eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_SUBMITTED,

        correlationId: `correlation-zero-link-${nonce}`,

        payload: {
          instructionId: zeroLinkAggregateId,
        },

        occurredAt: new Date(),
      },
    });

    const linkedOccurredAt = new Date();

    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: linkedAggregateId,

        version: 2,

        status: "APPROVED",

        snapshot: {
          id: linkedAggregateId,

          status: "APPROVED",

          marker: `immutable-${nonce}`,
        },
      },
    });

    await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: linkedEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: linkedAggregateId,

        aggregateVersion: 1,

        eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,

        correlationId: `correlation-linked-${nonce}`,

        payload: {
          instructionId: linkedAggregateId,

          approvalIds: [`approval-${nonce}`],

          approvedAt: linkedOccurredAt.toISOString(),
        },

        occurredAt: linkedOccurredAt,
      },
    });

    const concurrentOccurredAt = new Date(linkedOccurredAt.getTime() + 1);

    await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: concurrentEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: linkedAggregateId,

        aggregateVersion: 2,

        eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_FULFILLED,

        correlationId: `correlation-concurrent-${nonce}`,

        causationId: linkedEventId,

        payload: {
          instructionId: linkedAggregateId,

          fulfilledAt: concurrentOccurredAt.toISOString(),
        },

        occurredAt: concurrentOccurredAt,
      },
    });

    /*
     * 1. Unlinked Treasury event is a lawful no-op.
     */
    const zeroLink = await projectTreasuryGatewayEventReflectionsWithClient({
      sourceEventId: zeroLinkEventId,

      client,
    });

    assert(
      zeroLink.eligibleRoomCount === 0,
      "TREASURY_REFLECTION_ZERO_LINK_ELIGIBILITY_INVALID",
    );

    assert(
      zeroLink.createdCount === 0,
      "TREASURY_REFLECTION_ZERO_LINK_CREATED_ROW",
    );

    const zeroLinkReflectionCount =
      await prisma.communicationOperationalReflection.count({
        where: {
          sourceSystem: "TREASURY_GATEWAY",

          sourceEventId: zeroLinkEventId,
        },
      });

    assert(
      zeroLinkReflectionCount === 0,
      "TREASURY_REFLECTION_ZERO_LINK_PERSISTED",
    );

    /*
     * Snapshot authoritative Treasury state before
     * Communications receives institutional scope.
     */
    const treasuryBefore =
      await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

            aggregateId: linkedAggregateId,
          },
        },
      });

    /*
     * 2. Link only Room A.
     */
    await linkOperationalRoomTargetWithClient({
      client,

      principal: ownerPrincipal,

      roomId: roomA.room.id,

      targetType: "TREASURY_GATEWAY_AGGREGATE",

      targetSubtype: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

      targetId: linkedAggregateId,
    });

    const roomALinkCountBeforeProjection =
      await prisma.communicationOperationalLink.count({
        where: {
          roomId: roomA.room.id,
        },
      });

    const roomBLinkCountBeforeProjection =
      await prisma.communicationOperationalLink.count({
        where: {
          roomId: roomB.room.id,
        },
      });

    const messageCountBeforeProjection =
      await prisma.communicationMessage.count({
        where: {
          conversationId: {
            in: [roomA.conversation.id, roomB.conversation.id],
          },
        },
      });

    /*
     * 3. One linked room produces one reflection.
     */
    const firstProjection =
      await projectTreasuryGatewayEventReflectionsWithClient({
        sourceEventId: linkedEventId,

        client,
      });

    assert(
      firstProjection.eligibleRoomCount === 1,
      "TREASURY_REFLECTION_ONE_ROOM_ELIGIBILITY_INVALID",
    );

    assert(
      firstProjection.createdCount === 1,
      "TREASURY_REFLECTION_ONE_ROOM_CREATE_COUNT_INVALID",
    );

    /*
     * 4. Exact retry is naturally idempotent.
     */
    const exactRetry = await projectTreasuryGatewayEventReflectionsWithClient({
      sourceEventId: linkedEventId,

      client,
    });

    assert(
      exactRetry.eligibleRoomCount === 1,
      "TREASURY_REFLECTION_RETRY_ELIGIBILITY_INVALID",
    );

    assert(
      exactRetry.createdCount === 0,
      "TREASURY_REFLECTION_RETRY_CREATED_DUPLICATE",
    );

    const roomAReflection =
      await prisma.communicationOperationalReflection.findFirst({
        where: {
          operationalRoomId: roomA.room.id,

          sourceSystem: "TREASURY_GATEWAY",

          sourceEventId: linkedEventId,
        },
      });

    assert(
      roomAReflection !== null,
      "TREASURY_REFLECTION_ROOM_A_NOT_PERSISTED",
    );

    /*
     * Source provenance must survive exactly.
     */
    assert(
      roomAReflection.sourceAggregateType ===
        TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,
      "TREASURY_REFLECTION_SOURCE_AGGREGATE_TYPE_INVALID",
    );

    assert(
      roomAReflection.sourceAggregateId === linkedAggregateId,
      "TREASURY_REFLECTION_SOURCE_AGGREGATE_ID_INVALID",
    );

    assert(
      roomAReflection.sourceEventType ===
        TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,
      "TREASURY_REFLECTION_SOURCE_EVENT_TYPE_INVALID",
    );

    assert(
      roomAReflection.sourceOccurredAt.getTime() === linkedOccurredAt.getTime(),
      "TREASURY_REFLECTION_SOURCE_OCCURRED_AT_INVALID",
    );

    assert(
      roomAReflection.targetType === "TREASURY_GATEWAY_AGGREGATE" &&
        roomAReflection.targetSubtype ===
          TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION &&
        roomAReflection.targetId === linkedAggregateId,
      "TREASURY_REFLECTION_TARGET_POINTER_INVALID",
    );

    assert(
      roomAReflection.reflectionType === "STATE_OBSERVATION" &&
        roomAReflection.reflectionCode ===
          TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,
      "TREASURY_REFLECTION_CLASSIFICATION_INVALID",
    );

    /*
     * 5. Add exact institutional scope to Room B.
     *
     * Reprojecting the same authoritative event should
     * populate only the newly eligible room.
     */
    await linkOperationalRoomTargetWithClient({
      client,

      principal: ownerPrincipal,

      roomId: roomB.room.id,

      targetType: "TREASURY_GATEWAY_AGGREGATE",

      targetSubtype: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

      targetId: linkedAggregateId,
    });

    const fanOut = await projectTreasuryGatewayEventReflectionsWithClient({
      sourceEventId: linkedEventId,

      client,
    });

    assert(
      fanOut.eligibleRoomCount === 2,
      "TREASURY_REFLECTION_TWO_ROOM_ELIGIBILITY_INVALID",
    );

    assert(
      fanOut.createdCount === 1,
      "TREASURY_REFLECTION_SECOND_ROOM_CREATE_COUNT_INVALID",
    );

    const linkedEventReflectionCount =
      await prisma.communicationOperationalReflection.count({
        where: {
          sourceSystem: "TREASURY_GATEWAY",

          sourceEventId: linkedEventId,
        },
      });

    assert(
      linkedEventReflectionCount === 2,
      "TREASURY_REFLECTION_TWO_ROOM_CARDINALITY_INVALID",
    );

    /*
     * 6. Concurrent projection of a fresh source event.
     *
     * Both invocations see two eligible rooms.
     * Across the race, exactly two durable rows may appear.
     */
    const [concurrentA, concurrentB] = await Promise.all([
      projectTreasuryGatewayEventReflectionsWithClient({
        sourceEventId: concurrentEventId,

        client,
      }),

      projectTreasuryGatewayEventReflectionsWithClient({
        sourceEventId: concurrentEventId,

        client,
      }),
    ]);

    assert(
      concurrentA.eligibleRoomCount === 2 &&
        concurrentB.eligibleRoomCount === 2,
      "TREASURY_REFLECTION_CONCURRENT_ELIGIBILITY_INVALID",
    );

    assert(
      concurrentA.createdCount + concurrentB.createdCount === 2,
      "TREASURY_REFLECTION_CONCURRENT_CREATE_COUNT_INVALID",
    );

    const concurrentReflectionCount =
      await prisma.communicationOperationalReflection.count({
        where: {
          sourceSystem: "TREASURY_GATEWAY",

          sourceEventId: concurrentEventId,
        },
      });

    assert(
      concurrentReflectionCount === 2,
      "TREASURY_REFLECTION_CONCURRENT_DUPLICATE_PERSISTED",
    );

    /*
     * 7. Projection must not mutate source Treasury state.
     */
    const treasuryAfter =
      await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

            aggregateId: linkedAggregateId,
          },
        },
      });

    assert(
      JSON.stringify(treasuryBefore) === JSON.stringify(treasuryAfter),
      "TREASURY_REFLECTION_MUTATED_SOURCE_AGGREGATE",
    );

    /*
     * 8. Projection must not create/alter room links.
     */
    const roomALinkCountAfterProjection =
      await prisma.communicationOperationalLink.count({
        where: {
          roomId: roomA.room.id,
        },
      });

    const roomBLinkCountAfterProjection =
      await prisma.communicationOperationalLink.count({
        where: {
          roomId: roomB.room.id,
        },
      });

    assert(
      roomALinkCountBeforeProjection === roomALinkCountAfterProjection,
      "TREASURY_REFLECTION_MUTATED_ROOM_A_LINKS",
    );

    assert(
      roomBLinkCountAfterProjection === roomBLinkCountBeforeProjection + 1,
      "TREASURY_REFLECTION_ROOM_B_LINK_CARDINALITY_INVALID",
    );

    /*
     * 9. C3.2A does not create CommunicationMessage rows.
     */
    const messageCountAfterProjection = await prisma.communicationMessage.count(
      {
        where: {
          conversationId: {
            in: [roomA.conversation.id, roomB.conversation.id],
          },
        },
      },
    );

    assert(
      messageCountAfterProjection === messageCountBeforeProjection,
      "TREASURY_REFLECTION_CREATED_COMMUNICATION_MESSAGE",
    );

    console.log({
      zeroLinkNoOp: true,

      oneRoomProjection: true,

      exactRetryIdempotent: true,

      twoRoomFanOut: true,

      concurrentRetrySafe: true,

      provenancePreserved: true,

      treasuryAggregateUnchanged: true,

      roomLinksNotCreatedByProjector: true,

      communicationMessagesNotCreated: true,
    });
  } finally {
    /*
     * Communications first: conversation cascade removes
     * rooms, links, reflections, memberships and messages.
     */
    if (conversationIds.length > 0) {
      await prisma.communicationConversation.deleteMany({
        where: {
          id: {
            in: conversationIds,
          },
        },
      });
    }

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        eventId: {
          in: [zeroLinkEventId, linkedEventId, concurrentEventId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        OR: [
          {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

            aggregateId: zeroLinkAggregateId,
          },

          {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

            aggregateId: linkedAggregateId,
          },
        ],
      },
    });

    if (createdUserIds.length > 0) {
      await prisma.userRole.deleteMany({
        where: {
          userId: {
            in: createdUserIds,
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          id: {
            in: createdUserIds,
          },
        },
      });
    }

    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);

  process.exitCode = 1;
});
