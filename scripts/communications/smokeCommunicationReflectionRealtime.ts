import { PrismaClient } from "@prisma/client";

import { PERMISSIONS } from "../../src/domains/auth/permissions";
import type { Principal } from "../../src/domains/auth/types";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import {
  COMMUNICATION_REFLECTION_REALTIME_SIGNAL_TYPE,
  loadCommunicationReflectionRealtimeSignalsWithClient,
} from "../../src/domains/communications/realtime/loadCommunicationReflectionRealtimeSignalsWithClient";

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

  let conversationId: string | null = null;

  try {
    const userA = await prisma.user.create({
      data: {
        username: `reflection-rt-a-${nonce}`,

        email: `reflection-rt-a-${nonce}@axpt.local`,

        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",

        viewedDocs: [],
      },
    });

    const userB = await prisma.user.create({
      data: {
        username: `reflection-rt-b-${nonce}`,

        email: `reflection-rt-b-${nonce}@axpt.local`,

        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",

        viewedDocs: [],
      },
    });

    const userC = await prisma.user.create({
      data: {
        username: `reflection-rt-c-${nonce}`,

        email: `reflection-rt-c-${nonce}@axpt.local`,

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

    const principalB: Principal = {
      userId: userB.id,

      email: userB.email,

      roles: [],

      permissions: [PERMISSIONS.COMMUNICATIONS_ACCESS],
    };

    /*
     * Platform access without membership.
     */
    const principalC: Principal = {
      userId: userC.id,

      email: userC.email,

      roles: [],

      permissions: [PERMISSIONS.COMMUNICATIONS_ACCESS],
    };

    const now = Date.now();

    const since = new Date(now - 60_000);

    /*
     * Directly create the minimum governed
     * operational topology needed by this
     * read-side smoke.
     *
     * Room command/idempotency semantics are
     * covered elsewhere; this smoke owns only
     * reflection realtime visibility.
     */
    const conversation = await prisma.communicationConversation.create({
      data: {
        kind: "GROUP",

        status: "ACTIVE",

        title: `Reflection Realtime ${nonce}`,

        createdByUserId: userA.id,

        members: {
          create: [
            {
              userId: userA.id,

              role: "OWNER",
            },
            {
              userId: userB.id,

              role: "MEMBER",
            },
          ],
        },

        operationalRoom: {
          create: {
            clientRoomId: `reflection-rt-room-${nonce}`,

            requestFingerprint: `reflection-rt-fingerprint-${nonce}`,

            roomClass: "TREASURY",

            createdByUserId: userA.id,
          },
        },
      },

      include: {
        operationalRoom: true,
      },
    });

    conversationId = conversation.id;

    assert(
      conversation.operationalRoom !== null,
      "REFLECTION_REALTIME_OPERATIONAL_ROOM_MISSING",
    );

    const operationalRoomId = conversation.operationalRoom.id;

    /*
     * sourceOccurredAt is intentionally old.
     *
     * createdAt is current.
     *
     * This proves realtime freshness follows
     * Communications observation time rather
     * than institutional source chronology.
     */
    const reflection = await prisma.communicationOperationalReflection.create({
      data: {
        operationalRoomId,

        sourceSystem: "TREASURY_GATEWAY",

        sourceEventId: `reflection-rt-source-${nonce}`,

        sourceAggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        sourceAggregateId: `reflection-rt-target-${nonce}`,

        sourceEventType: "TREASURY_INSTRUCTION_APPROVED",

        sourceOccurredAt: new Date(now - 24 * 60 * 60 * 1000),

        targetType: "TREASURY_GATEWAY_AGGREGATE",

        targetSubtype: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

        targetId: `reflection-rt-target-${nonce}`,

        reflectionType: "STATE_OBSERVATION",

        reflectionCode: "TREASURY_INSTRUCTION_APPROVED",

        createdAt: new Date(now),
      },
    });

    /*
     * 1. Active member receives freshness signal.
     */
    const memberRecords =
      await loadCommunicationReflectionRealtimeSignalsWithClient({
        client,

        principal: principalB,

        since,
      });

    const record = memberRecords.find(
      (item) => item.signal.reflectionId === reflection.id,
    );

    assert(record !== undefined, "REFLECTION_REALTIME_MEMBER_SIGNAL_MISSING");

    assert(
      record.signal.type === COMMUNICATION_REFLECTION_REALTIME_SIGNAL_TYPE,
      "REFLECTION_REALTIME_SIGNAL_TYPE_INVALID",
    );

    assert(
      record.signal.id === `reflection:${reflection.id}`,
      "REFLECTION_REALTIME_SIGNAL_ID_INVALID",
    );

    assert(
      record.signal.conversationId === conversation.id &&
        record.signal.operationalRoomId === operationalRoomId,
      "REFLECTION_REALTIME_SCOPE_INVALID",
    );

    assert(
      record.signal.createdAt === reflection.createdAt.toISOString(),
      "REFLECTION_REALTIME_CREATED_AT_INVALID",
    );

    /*
     * 2. Thin signal carries no institutional
     * source payload or Treasury state.
     */
    const serializedSignal = JSON.stringify(record.signal);

    for (const forbidden of [
      "sourceEventId",
      "sourceAggregateType",
      "sourceAggregateId",
      "sourceEventType",
      "sourceOccurredAt",
      "targetType",
      "targetSubtype",
      "targetId",
      "reflectionType",
      "reflectionCode",
      "TREASURY_INSTRUCTION_APPROVED",
    ]) {
      assert(
        !serializedSignal.includes(forbidden),
        `REFLECTION_REALTIME_SIGNAL_LEAKED:${forbidden}`,
      );
    }

    /*
     * 3. Old source occurrence must not suppress
     * a newly persisted reflection.
     */
    assert(
      record.createdAt.getTime() >= since.getTime(),
      "REFLECTION_REALTIME_DID_NOT_USE_CREATED_AT_FRESHNESS",
    );

    /*
     * 4. Non-member cannot observe the room.
     */
    const nonMemberRecords =
      await loadCommunicationReflectionRealtimeSignalsWithClient({
        client,

        principal: principalC,

        since,
      });

    assert(
      !nonMemberRecords.some(
        (item) => item.signal.reflectionId === reflection.id,
      ),
      "REFLECTION_REALTIME_NON_MEMBER_SIGNAL_LEAK",
    );

    /*
     * 5. Membership revocation takes effect on
     * the next retrieval using the same Principal.
     */
    await prisma.communicationMember.update({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,

          userId: userB.id,
        },
      },

      data: {
        leftAt: new Date(),
      },
    });

    const afterRevocation =
      await loadCommunicationReflectionRealtimeSignalsWithClient({
        client,

        principal: principalB,

        since,
      });

    assert(
      !afterRevocation.some(
        (item) => item.signal.reflectionId === reflection.id,
      ),
      "REFLECTION_REALTIME_REVOKED_MEMBER_STILL_RECEIVES_SIGNAL",
    );

    /*
     * Restore membership to isolate archive proof.
     */
    await prisma.communicationMember.update({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,

          userId: userB.id,
        },
      },

      data: {
        leftAt: null,
      },
    });

    /*
     * 6. Archived operational conversations are
     * not realtime-active.
     */
    await prisma.communicationConversation.update({
      where: {
        id: conversation.id,
      },

      data: {
        status: "ARCHIVED",

        archivedAt: new Date(),
      },
    });

    const afterArchive =
      await loadCommunicationReflectionRealtimeSignalsWithClient({
        client,

        principal: principalB,

        since,
      });

    assert(
      !afterArchive.some((item) => item.signal.reflectionId === reflection.id),
      "REFLECTION_REALTIME_ARCHIVED_CONVERSATION_VISIBLE",
    );

    /*
     * 7. Platform permission remains independent
     * of membership.
     */
    const principalWithoutAccess: Principal = {
      userId: userA.id,

      email: userA.email,

      roles: [],

      permissions: [],
    };

    let permissionBlocked = false;

    try {
      await loadCommunicationReflectionRealtimeSignalsWithClient({
        client,

        principal: principalWithoutAccess,

        since,
      });
    } catch (error: unknown) {
      permissionBlocked =
        error instanceof Error &&
        error.message === "MISSING_PERMISSION:COMMUNICATIONS_ACCESS";
    }

    assert(
      permissionBlocked,
      "REFLECTION_REALTIME_PERMISSION_BOUNDARY_NOT_ENFORCED",
    );

    /*
     * 8. Invalid loader inputs are rejected.
     */
    let invalidCursorBlocked = false;

    try {
      await loadCommunicationReflectionRealtimeSignalsWithClient({
        client,

        principal: principalA,

        since: new Date(Number.NaN),
      });
    } catch (error: unknown) {
      invalidCursorBlocked =
        error instanceof Error &&
        error.message === "COMMUNICATION_REFLECTION_REALTIME_CURSOR_INVALID";
    }

    assert(
      invalidCursorBlocked,
      "REFLECTION_REALTIME_INVALID_CURSOR_NOT_BLOCKED",
    );

    let invalidLimitBlocked = false;

    try {
      await loadCommunicationReflectionRealtimeSignalsWithClient({
        client,

        principal: principalA,

        since,

        limit: 0,
      });
    } catch (error: unknown) {
      invalidLimitBlocked =
        error instanceof Error &&
        error.message === "COMMUNICATION_REFLECTION_REALTIME_LIMIT_INVALID";
    }

    assert(
      invalidLimitBlocked,
      "REFLECTION_REALTIME_INVALID_LIMIT_NOT_BLOCKED",
    );

    console.log({
      memberReceivesReflectionSignal: true,

      thinSignalOnly: true,

      createdAtDrivesFreshness: true,

      sourceOccurredAtDoesNotDriveFreshness: true,

      nonMemberSignalHidden: true,

      revokedMembershipEnforced: true,

      archivedConversationHidden: true,

      permissionBoundaryEnforced: true,

      invalidCursorBlocked: true,

      invalidLimitBlocked: true,

      noDomainEventRequired: true,
    });
  } finally {
    if (conversationId) {
      await prisma.communicationConversation.deleteMany({
        where: {
          id: conversationId,
        },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: createdUserIds,
          },
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
