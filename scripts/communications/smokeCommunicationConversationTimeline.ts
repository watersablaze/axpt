import { PrismaClient } from "@prisma/client";

import { PERMISSIONS } from "../../src/domains/auth/permissions";
import type { Principal } from "../../src/domains/auth/types";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import {
  loadConversationTimelineWithClient,
  COMMUNICATION_TIMELINE_ITEM_TYPE,
} from "../../src/domains/communications/timeline/loadConversationTimelineWithClient";

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

  const createdUserIds: string[] = [];

  const conversationIds: string[] = [];

  try {
    const userA = await prisma.user.create({
      data: {
        username: `timeline-a-${nonce}`,

        email: `timeline-a-${nonce}@axpt.local`,

        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",

        viewedDocs: [],
      },
    });

    const userB = await prisma.user.create({
      data: {
        username: `timeline-b-${nonce}`,

        email: `timeline-b-${nonce}@axpt.local`,

        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",

        viewedDocs: [],
      },
    });

    const userC = await prisma.user.create({
      data: {
        username: `timeline-c-${nonce}`,

        email: `timeline-c-${nonce}@axpt.local`,

        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",

        viewedDocs: [],
      },
    });

    createdUserIds.push(userA.id, userB.id, userC.id);

    const principalA: Principal = {
      userId: userA.id,

      email: userA.email,

      roles: ["ADMIN_PLATFORM"],

      permissions: [PERMISSIONS.COMMUNICATIONS_ACCESS],
    };

    const principalC: Principal = {
      userId: userC.id,

      email: userC.email,

      roles: ["ADMIN_PLATFORM"],

      permissions: [PERMISSIONS.COMMUNICATIONS_ACCESS],
    };

    /*
     * ──────────────────────────────────────────
     * DIRECT conversation
     * ──────────────────────────────────────────
     *
     * Proves a non-operational conversation
     * produces message-only timeline material.
     */
    const directConversation = await prisma.communicationConversation.create({
      data: {
        kind: "DIRECT",

        status: "ACTIVE",

        createdByUserId: userA.id,

        members: {
          create: [
            {
              userId: userA.id,

              role: "MEMBER",
            },
            {
              userId: userB.id,

              role: "MEMBER",
            },
          ],
        },
      },
    });

    conversationIds.push(directConversation.id);

    const directMessage = await prisma.communicationMessage.create({
      data: {
        conversationId: directConversation.id,

        senderUserId: userA.id,

        clientMessageId: `timeline-direct-message-${nonce}`,

        kind: "TEXT",

        body: "Direct timeline message",

        createdAt: new Date("2026-09-11T08:00:00.000Z"),
      },
    });

    const directTimeline = await loadConversationTimelineWithClient({
      client,

      principal: principalA,

      conversationId: directConversation.id,
    });

    assert(
      directTimeline.messageCount === 1,
      "COMMUNICATION_TIMELINE_DIRECT_MESSAGE_COUNT_INVALID",
    );

    assert(
      directTimeline.reflectionCount === 0,
      "COMMUNICATION_TIMELINE_DIRECT_REFLECTION_COUNT_INVALID",
    );

    assert(
      directTimeline.items.length === 1 &&
        directTimeline.items[0]?.itemType ===
          COMMUNICATION_TIMELINE_ITEM_TYPE.MESSAGE &&
        directTimeline.items[0]?.id === directMessage.id,
      "COMMUNICATION_TIMELINE_DIRECT_SHAPE_INVALID",
    );

    /*
     * ──────────────────────────────────────────
     * OPERATIONAL conversation
     * ──────────────────────────────────────────
     */
    const operationalConversation =
      await prisma.communicationConversation.create({
        data: {
          kind: "GROUP",

          status: "ACTIVE",

          title: `Timeline Room ${nonce}`,

          createdByUserId: userA.id,

          members: {
            create: [
              {
                userId: userA.id,

                role: "OWNER",

                lastReadAt: new Date("2026-09-11T07:30:00.000Z"),
              },
              {
                userId: userB.id,

                role: "MEMBER",
              },
            ],
          },

          operationalRoom: {
            create: {
              clientRoomId: `timeline-room-${nonce}`,

              requestFingerprint: `timeline-fingerprint-${nonce}`,

              roomClass: "TREASURY",

              createdByUserId: userA.id,
            },
          },
        },

        include: {
          operationalRoom: true,
        },
      });

    conversationIds.push(operationalConversation.id);

    assert(
      operationalConversation.operationalRoom !== null,
      "COMMUNICATION_TIMELINE_OPERATIONAL_ROOM_MISSING",
    );

    const operationalRoomId = operationalConversation.operationalRoom.id;

    const membershipBefore = await prisma.communicationMember.findUniqueOrThrow(
      {
        where: {
          conversationId_userId: {
            conversationId: operationalConversation.id,

            userId: userA.id,
          },
        },

        select: {
          lastReadMessageId: true,

          lastReadAt: true,
        },
      },
    );

    /*
     * Deliberately interleaved institutional time:
     *
     * 10:00 message A
     * 10:30 reflection A
     * 11:00 message B
     * 11:30 reflection B
     * 12:00 message C
     *
     * Reflection persistence happens later than its
     * source occurrence to prove presentation uses
     * sourceOccurredAt rather than createdAt.
     */
    const messageA = await prisma.communicationMessage.create({
      data: {
        conversationId: operationalConversation.id,

        senderUserId: userA.id,

        clientMessageId: `timeline-message-a-${nonce}`,

        kind: "TEXT",

        body: "Timeline message A",

        createdAt: new Date("2026-09-11T10:00:00.000Z"),
      },
    });

    const reflectionA = await prisma.communicationOperationalReflection.create({
      data: {
        operationalRoomId,

        sourceSystem: "TREASURY_GATEWAY",

        sourceEventId: `timeline-reflection-event-a-${nonce}`,

        sourceAggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        sourceAggregateId: `timeline-target-${nonce}`,

        sourceEventType: "TREASURY_INSTRUCTION_APPROVED",

        sourceOccurredAt: new Date("2026-09-11T10:30:00.000Z"),

        targetType: "TREASURY_GATEWAY_AGGREGATE",

        targetSubtype: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        targetId: `timeline-target-${nonce}`,

        reflectionType: "STATE_OBSERVATION",

        reflectionCode: "TREASURY_INSTRUCTION_APPROVED",

        /*
         * Deliberately much later than sourceOccurredAt.
         */
        createdAt: new Date("2026-09-11T13:00:00.000Z"),
      },
    });

    const messageB = await prisma.communicationMessage.create({
      data: {
        conversationId: operationalConversation.id,

        senderUserId: userB.id,

        clientMessageId: `timeline-message-b-${nonce}`,

        kind: "STATUS_UPDATE",

        body: "Timeline message B",

        createdAt: new Date("2026-09-11T11:00:00.000Z"),
      },
    });

    const reflectionB = await prisma.communicationOperationalReflection.create({
      data: {
        operationalRoomId,

        sourceSystem: "TREASURY_GATEWAY",

        sourceEventId: `timeline-reflection-event-b-${nonce}`,

        sourceAggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        sourceAggregateId: `timeline-target-${nonce}`,

        sourceEventType: "TREASURY_INSTRUCTION_APPROVED",

        sourceOccurredAt: new Date("2026-09-11T11:30:00.000Z"),

        targetType: "TREASURY_GATEWAY_AGGREGATE",

        targetSubtype: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        targetId: `timeline-target-${nonce}`,

        reflectionType: "STATE_OBSERVATION",

        reflectionCode: "TREASURY_INSTRUCTION_APPROVED",

        createdAt: new Date("2026-09-11T13:01:00.000Z"),
      },
    });

    const messageC = await prisma.communicationMessage.create({
      data: {
        conversationId: operationalConversation.id,

        senderUserId: userA.id,

        clientMessageId: `timeline-message-c-${nonce}`,

        kind: "TEXT",

        body: "Timeline message C",

        createdAt: new Date("2026-09-11T12:00:00.000Z"),
      },
    });

    const messageCountBefore = await prisma.communicationMessage.count({
      where: {
        conversationId: operationalConversation.id,
      },
    });

    const reflectionCountBefore =
      await prisma.communicationOperationalReflection.count({
        where: {
          operationalRoomId,
        },
      });

    /*
     * 1. Member may retrieve the unified presentation.
     */
    const timeline = await loadConversationTimelineWithClient({
      client,

      principal: principalA,

      conversationId: operationalConversation.id,
    });

    assert(
      timeline.messageCount === 3 && timeline.reflectionCount === 2,
      "COMMUNICATION_TIMELINE_COUNTS_INVALID",
    );

    /*
     * 2. Strict chronological composition across both
     * persistence stores.
     */
    const expectedOrder = [
      messageA.id,
      reflectionA.id,
      messageB.id,
      reflectionB.id,
      messageC.id,
    ];

    assert(
      timeline.items.map((item) => item.id).join("|") ===
        expectedOrder.join("|"),
      "COMMUNICATION_TIMELINE_CHRONOLOGICAL_ORDER_INVALID",
    );

    assert(
      timeline.items[0]?.itemType ===
        COMMUNICATION_TIMELINE_ITEM_TYPE.MESSAGE &&
        timeline.items[1]?.itemType ===
          COMMUNICATION_TIMELINE_ITEM_TYPE.INSTITUTIONAL_REFLECTION &&
        timeline.items[2]?.itemType ===
          COMMUNICATION_TIMELINE_ITEM_TYPE.MESSAGE &&
        timeline.items[3]?.itemType ===
          COMMUNICATION_TIMELINE_ITEM_TYPE.INSTITUTIONAL_REFLECTION &&
        timeline.items[4]?.itemType ===
          COMMUNICATION_TIMELINE_ITEM_TYPE.MESSAGE,
      "COMMUNICATION_TIMELINE_DISCRIMINATION_INVALID",
    );

    /*
     * 3. Reflection placement must use authoritative
     * source occurrence time, not reflection persistence time.
     */
    const reflectionAItem = timeline.items.find(
      (item) => item.id === reflectionA.id,
    );

    assert(
      reflectionAItem !== undefined &&
        reflectionAItem.itemType ===
          COMMUNICATION_TIMELINE_ITEM_TYPE.INSTITUTIONAL_REFLECTION &&
        reflectionAItem.occurredAt.getTime() ===
          reflectionA.sourceOccurredAt.getTime() &&
        reflectionAItem.occurredAt.getTime() !==
          reflectionA.createdAt.getTime(),
      "COMMUNICATION_TIMELINE_REFLECTION_OCCURRENCE_TIME_INVALID",
    );

    /*
     * 4. Independent source limits:
     *
     * newest 2 messages → B, C
     * newest 1 reflection → B
     *
     * then presentation sorting → B message,
     * B reflection, C message.
     */
    const limitedTimeline = await loadConversationTimelineWithClient({
      client,

      principal: principalA,

      conversationId: operationalConversation.id,

      messageLimit: 2,

      reflectionLimit: 1,
    });

    assert(
      limitedTimeline.messageCount === 2 &&
        limitedTimeline.reflectionCount === 1,
      "COMMUNICATION_TIMELINE_INDEPENDENT_LIMIT_COUNTS_INVALID",
    );

    assert(
      limitedTimeline.items.map((item) => item.id).join("|") ===
        [messageB.id, reflectionB.id, messageC.id].join("|"),
      "COMMUNICATION_TIMELINE_INDEPENDENT_LIMIT_ORDER_INVALID",
    );

    /*
     * 5. Non-member authority remains enforced.
     */
    let outsiderBlocked = false;

    try {
      await loadConversationTimelineWithClient({
        client,

        principal: principalC,

        conversationId: operationalConversation.id,
      });
    } catch (error: unknown) {
      outsiderBlocked =
        error instanceof Error &&
        error.message === "COMMUNICATION_CONVERSATION_ACCESS_DENIED";
    }

    assert(outsiderBlocked, "COMMUNICATION_TIMELINE_NON_MEMBER_NOT_BLOCKED");

    /*
     * 6. Retrieval itself is observational.
     *
     * No message/reflection creation and no read-marker
     * advancement belongs to the timeline loader.
     */
    const messageCountAfter = await prisma.communicationMessage.count({
      where: {
        conversationId: operationalConversation.id,
      },
    });

    const reflectionCountAfter =
      await prisma.communicationOperationalReflection.count({
        where: {
          operationalRoomId,
        },
      });

    const membershipAfter = await prisma.communicationMember.findUniqueOrThrow({
      where: {
        conversationId_userId: {
          conversationId: operationalConversation.id,

          userId: userA.id,
        },
      },

      select: {
        lastReadMessageId: true,

        lastReadAt: true,
      },
    });

    assert(
      messageCountAfter === messageCountBefore,
      "COMMUNICATION_TIMELINE_MUTATED_MESSAGES",
    );

    assert(
      reflectionCountAfter === reflectionCountBefore,
      "COMMUNICATION_TIMELINE_MUTATED_REFLECTIONS",
    );

    assert(
      membershipAfter.lastReadMessageId ===
        membershipBefore.lastReadMessageId &&
        membershipAfter.lastReadAt?.getTime() ===
          membershipBefore.lastReadAt?.getTime(),
      "COMMUNICATION_TIMELINE_MUTATED_READ_MARKER",
    );

    console.log({
      memberTimelineAccess: true,

      nonMemberBlocked: true,

      directConversationMessagesOnly: true,

      mixedChronologicalOrdering: true,

      reflectionUsesSourceOccurredAt: true,

      independentSourceLimits: true,

      messagesUnchanged: true,

      reflectionsUnchanged: true,

      readMarkerUnchanged: true,
    });
  } finally {
    if (conversationIds.length > 0) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamType: "COMMUNICATION_CONVERSATION",

          streamId: {
            in: conversationIds,
          },
        },
      });

      await prisma.communicationConversation.deleteMany({
        where: {
          id: {
            in: conversationIds,
          },
        },
      });
    }

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
