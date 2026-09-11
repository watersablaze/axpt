import { PrismaClient } from "@prisma/client";

import { PERMISSIONS } from "../../src/domains/auth/permissions";
import type { Principal } from "../../src/domains/auth/types";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { createOperationalRoomWithClient } from "../../src/domains/communications/operational-rooms/createOperationalRoomWithClient";

import { linkOperationalRoomTargetWithClient } from "../../src/domains/communications/operational-links/linkOperationalRoomTargetWithClient";

import { projectTreasuryGatewayEventReflectionsWithClient } from "../../src/domains/communications/reflections/projectTreasuryGatewayEventReflectionsWithClient";

import {
  runTreasuryReflectionIntakeBatchWithClient,
  runTreasuryReflectionIntakeBatchWithDependencies,
  TREASURY_REFLECTION_INTAKE_ITEM_STATUS,
} from "../../src/domains/communications/reflections/runTreasuryReflectionIntakeBatchWithClient";

import { COMMUNICATION_REFLECTION_SOURCE_SYSTEM } from "../../src/domains/communications/reflections/reflectionVocabulary";

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

  const linkedAggregateId = `reflection-runner-linked-${nonce}`;

  const unlinkedAggregateId = `reflection-runner-unlinked-${nonce}`;

  const submittedEventId = `reflection-runner-submitted-${nonce}`;

  const unlinkedApprovedEventId = `reflection-runner-unlinked-approved-${nonce}`;

  const linkedApprovedEventId = `reflection-runner-linked-approved-${nonce}`;

  const fulfilledEventId = `reflection-runner-fulfilled-${nonce}`;

  const eventIds = [
    submittedEventId,
    unlinkedApprovedEventId,
    linkedApprovedEventId,
    fulfilledEventId,
  ];

  const createdUserIds: string[] = [];

  let conversationId: string | null = null;

  try {
    /*
     * Resolve canonical Communications membership eligibility.
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
        username: `reflection-runner-owner-${nonce}`,

        email: `reflection-runner-owner-${nonce}@axpt.local`,

        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",

        viewedDocs: [],
      },
    });

    const member = await prisma.user.create({
      data: {
        username: `reflection-runner-member-${nonce}`,

        email: `reflection-runner-member-${nonce}@axpt.local`,

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
     * Establish one Treasury operational room.
     */
    const room = await createOperationalRoomWithClient({
      client,

      principal: ownerPrincipal,

      clientRoomId: `reflection-runner-room-${nonce}`,

      title: `Treasury Reflection Runner ${nonce}`,

      roomClass: "TREASURY",

      memberUserIds: [member.id],
    });

    conversationId = room.conversation.id;

    /*
     * Capture current Treasury high-water BEFORE fixture events.
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

    /*
     * Create authoritative Treasury snapshots.
     *
     * Communications never creates these in production;
     * they are smoke fixtures for intake observation only.
     */
    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: linkedAggregateId,

        version: 3,

        status: "FULFILLED",

        snapshot: {
          id: linkedAggregateId,

          status: "FULFILLED",

          marker: `linked-${nonce}`,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: unlinkedAggregateId,

        version: 1,

        status: "APPROVED",

        snapshot: {
          id: unlinkedAggregateId,

          status: "APPROVED",

          marker: `unlinked-${nonce}`,
        },
      },
    });

    /*
     * Only the linked aggregate grants Communications scope.
     */
    await linkOperationalRoomTargetWithClient({
      client,

      principal: ownerPrincipal,

      roomId: room.room.id,

      targetType: "TREASURY_GATEWAY_AGGREGATE",

      targetSubtype: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

      targetId: linkedAggregateId,
    });

    const linkedTreasuryBefore =
      await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

            aggregateId: linkedAggregateId,
          },
        },
      });

    const roomLinkCountBefore = await prisma.communicationOperationalLink.count(
      {
        where: {
          roomId: room.room.id,
        },
      },
    );

    const messageCountBefore = await prisma.communicationMessage.count({
      where: {
        conversationId: room.conversation.id,
      },
    });

    /*
     * Authoritative source sequence:
     *
     * 1 SUBMITTED         → skip
     * 2 APPROVED/unlinked → reflect with zero rooms
     * 3 APPROVED/linked   → injected failure
     * 4 FULFILLED         → must not be crossed on failure
     */
    const submitted = await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: submittedEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: linkedAggregateId,

        aggregateVersion: 1,

        eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_SUBMITTED,

        correlationId: `runner-linked-${nonce}`,

        payload: {
          instructionId: linkedAggregateId,
        },

        occurredAt: new Date(),
      },
    });

    const unlinkedApproved = await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: unlinkedApprovedEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: unlinkedAggregateId,

        aggregateVersion: 1,

        eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,

        correlationId: `runner-unlinked-${nonce}`,

        payload: {
          instructionId: unlinkedAggregateId,

          approvalIds: [`unlinked-approval-${nonce}`],
        },

        occurredAt: new Date(),
      },
    });

    const linkedApproved = await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: linkedApprovedEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: linkedAggregateId,

        aggregateVersion: 2,

        eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,

        correlationId: `runner-linked-${nonce}`,

        causationId: submittedEventId,

        payload: {
          instructionId: linkedAggregateId,

          approvalIds: [`linked-approval-${nonce}`],
        },

        occurredAt: new Date(),
      },
    });

    const fulfilled = await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: fulfilledEventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        aggregateId: linkedAggregateId,

        aggregateVersion: 3,

        eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_FULFILLED,

        correlationId: `runner-linked-${nonce}`,

        causationId: linkedApprovedEventId,

        payload: {
          instructionId: linkedAggregateId,
        },

        occurredAt: new Date(),
      },
    });

    assert(
      submitted.sequence < unlinkedApproved.sequence &&
        unlinkedApproved.sequence < linkedApproved.sequence &&
        linkedApproved.sequence < fulfilled.sequence,
      "TREASURY_REFLECTION_RUNNER_FIXTURE_SEQUENCE_INVALID",
    );

    /*
     * Inject one deterministic projector failure.
     */
    let injectedFailureObserved = false;

    try {
      await runTreasuryReflectionIntakeBatchWithDependencies({
        client,

        limit: 20,

        projectEvent: async ({ sourceEventId, client: transactionClient }) => {
          if (sourceEventId === linkedApprovedEventId) {
            throw new Error("C3_2B_INJECTED_PROJECTOR_FAILURE");
          }

          return projectTreasuryGatewayEventReflectionsWithClient({
            sourceEventId,

            client: transactionClient,
          });
        },
      });
    } catch (error: unknown) {
      injectedFailureObserved =
        error instanceof Error &&
        error.message === "C3_2B_INJECTED_PROJECTOR_FAILURE";
    }

    assert(
      injectedFailureObserved,
      "TREASURY_REFLECTION_RUNNER_INJECTED_FAILURE_NOT_OBSERVED",
    );

    /*
     * Events 1 and 2 committed before event 3 failed.
     * Cursor must be exactly event 2 — never event 3 or 4.
     */
    const cursorAfterFailure =
      await prisma.communicationReflectionIntakeCursor.findUniqueOrThrow({
        where: {
          sourceSystem,
        },
      });

    assert(
      cursorAfterFailure.lastSequence === unlinkedApproved.sequence,
      "TREASURY_REFLECTION_RUNNER_CURSOR_CROSSED_FAILED_EVENT",
    );

    assert(
      cursorAfterFailure.lastEventId === unlinkedApprovedEventId,
      "TREASURY_REFLECTION_RUNNER_FAILURE_CURSOR_PROVENANCE_INVALID",
    );

    /*
     * Event 2 was reflectable but had zero linked rooms.
     * It was still successfully examined and checkpointed.
     */
    const unlinkedReflectionCount =
      await prisma.communicationOperationalReflection.count({
        where: {
          sourceSystem,

          sourceEventId: unlinkedApprovedEventId,
        },
      });

    assert(
      unlinkedReflectionCount === 0,
      "TREASURY_REFLECTION_RUNNER_UNLINKED_EVENT_CREATED_REFLECTION",
    );

    /*
     * Event 3 projection failed inside the transaction:
     * no reflection may survive.
     */
    const failedEventReflectionCount =
      await prisma.communicationOperationalReflection.count({
        where: {
          sourceSystem,

          sourceEventId: linkedApprovedEventId,
        },
      });

    assert(
      failedEventReflectionCount === 0,
      "TREASURY_REFLECTION_RUNNER_FAILED_EVENT_REFLECTION_SURVIVED",
    );

    /*
     * Event 4 must not have been examined because processing
     * stopped at failed event 3.
     */
    assert(
      cursorAfterFailure.lastSequence < fulfilled.sequence,
      "TREASURY_REFLECTION_RUNNER_CROSSED_POST_FAILURE_EVENT",
    );

    /*
     * Restore real projector and resume.
     *
     * Only events 3 and 4 remain after the durable cursor.
     */
    const recovered = await runTreasuryReflectionIntakeBatchWithClient({
      client,

      limit: 20,
    });

    assert(
      recovered.startSequence === unlinkedApproved.sequence,
      "TREASURY_REFLECTION_RUNNER_RECOVERY_START_INVALID",
    );

    assert(
      recovered.discovered === 2,
      "TREASURY_REFLECTION_RUNNER_RECOVERY_DISCOVERY_INVALID",
    );

    assert(
      recovered.examined === 2,
      "TREASURY_REFLECTION_RUNNER_RECOVERY_EXAMINED_INVALID",
    );

    assert(
      recovered.reflected === 1 && recovered.skipped === 1,
      "TREASURY_REFLECTION_RUNNER_RECOVERY_POLICY_COUNTS_INVALID",
    );

    assert(
      recovered.createdReflections === 1,
      "TREASURY_REFLECTION_RUNNER_RECOVERY_REFLECTION_COUNT_INVALID",
    );

    assert(
      recovered.items[0]?.eventId === linkedApprovedEventId &&
        recovered.items[0]?.status ===
          TREASURY_REFLECTION_INTAKE_ITEM_STATUS.REFLECTED,
      "TREASURY_REFLECTION_RUNNER_RECOVERY_APPROVED_ITEM_INVALID",
    );

    assert(
      recovered.items[1]?.eventId === fulfilledEventId &&
        recovered.items[1]?.status ===
          TREASURY_REFLECTION_INTAKE_ITEM_STATUS.SKIPPED,
      "TREASURY_REFLECTION_RUNNER_RECOVERY_FULFILLED_ITEM_INVALID",
    );

    assert(
      recovered.endSequence === fulfilled.sequence,
      "TREASURY_REFLECTION_RUNNER_RECOVERY_END_INVALID",
    );

    /*
     * Exact linked-room reflection persisted once.
     */
    const linkedReflection =
      await prisma.communicationOperationalReflection.findMany({
        where: {
          sourceSystem,

          sourceEventId: linkedApprovedEventId,
        },
      });

    assert(
      linkedReflection.length === 1,
      "TREASURY_REFLECTION_RUNNER_LINKED_REFLECTION_CARDINALITY_INVALID",
    );

    assert(
      linkedReflection[0]?.operationalRoomId === room.room.id &&
        linkedReflection[0]?.sourceAggregateId === linkedAggregateId &&
        linkedReflection[0]?.sourceEventType ===
          TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,
      "TREASURY_REFLECTION_RUNNER_LINKED_REFLECTION_PROVENANCE_INVALID",
    );

    /*
     * Exact rerun must discover no remaining event.
     */
    const exactRerun = await runTreasuryReflectionIntakeBatchWithClient({
      client,

      limit: 20,
    });

    assert(
      exactRerun.discovered === 0 &&
        exactRerun.examined === 0 &&
        exactRerun.createdReflections === 0,
      "TREASURY_REFLECTION_RUNNER_EXACT_RERUN_NOT_EMPTY",
    );

    const finalCursor =
      await prisma.communicationReflectionIntakeCursor.findUniqueOrThrow({
        where: {
          sourceSystem,
        },
      });

    assert(
      finalCursor.lastSequence === fulfilled.sequence &&
        finalCursor.lastEventId === fulfilledEventId,
      "TREASURY_REFLECTION_RUNNER_FINAL_CURSOR_INVALID",
    );

    /*
     * Communications remains observational.
     */
    const linkedTreasuryAfter =
      await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

            aggregateId: linkedAggregateId,
          },
        },
      });

    assert(
      JSON.stringify(linkedTreasuryBefore) ===
        JSON.stringify(linkedTreasuryAfter),
      "TREASURY_REFLECTION_RUNNER_MUTATED_TREASURY_AGGREGATE",
    );

    const sourceEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        eventId: {
          in: eventIds,
        },
      },
    });

    assert(
      sourceEventCount === 4,
      "TREASURY_REFLECTION_RUNNER_MUTATED_SOURCE_EVENTS",
    );

    const roomLinkCountAfter = await prisma.communicationOperationalLink.count({
      where: {
        roomId: room.room.id,
      },
    });

    assert(
      roomLinkCountAfter === roomLinkCountBefore,
      "TREASURY_REFLECTION_RUNNER_MUTATED_ROOM_LINKS",
    );

    const messageCountAfter = await prisma.communicationMessage.count({
      where: {
        conversationId: room.conversation.id,
      },
    });

    assert(
      messageCountAfter === messageCountBefore,
      "TREASURY_REFLECTION_RUNNER_CREATED_MESSAGE",
    );

    console.log({
      orderedSkipBeforeFailure: true,

      zeroLinkApprovedCheckpointed: true,

      injectedProjectorFailureObserved: true,

      failedProjectionRolledBack: true,

      cursorStoppedBeforeFailedEvent: true,

      postFailureEventNotCrossed: true,

      recoveryResumedAtFailedEvent: true,

      linkedApprovedReflectedExactlyOnce: true,

      laterNonEligibleEventSkipped: true,

      exactRerunEmpty: true,

      finalCursorProvenanceExact: true,

      treasuryAggregateUnchanged: true,

      treasuryEventsUnchanged: true,

      roomLinksUnchanged: true,

      communicationMessagesUnchanged: true,
    });
  } finally {
    /*
     * Communications first: cascade room-owned reflections.
     */
    if (conversationId) {
      await prisma.communicationConversation.deleteMany({
        where: {
          id: conversationId,
        },
      });
    }

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
          in: [linkedAggregateId, unlinkedAggregateId],
        },
      },
    });

    await prisma.communicationReflectionIntakeCursor.deleteMany({
      where: {
        sourceSystem,
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
