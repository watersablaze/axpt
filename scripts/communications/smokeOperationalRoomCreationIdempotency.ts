import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { createOperationalRoomWithClient } from "../../src/domains/communications/operational-rooms/createOperationalRoomWithClient"

import type { CommunicationsDatabaseClient } from "../../src/domains/communications/shared/databaseTypes"

const prisma = new PrismaClient()

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  const nonce =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`

  const client =
    prisma as unknown as CommunicationsDatabaseClient

  const createdUserIds: string[] = []
  const createdConversationIds: string[] = []
  const createdRoomIds: string[] = []

  try {
    /*
     * Resolve a real role that already carries
     * COMMUNICATIONS_ACCESS.
     */
    const communicationsRole =
      await prisma.role.findFirst({
        where: {
          rolePermissions: {
            some: {
              permission: {
                key:
                  PERMISSIONS.COMMUNICATIONS_ACCESS,
              },
            },
          },
        },

        select: {
          id: true,
          key: true,
        },
      })

    assert(
      communicationsRole !== null,
      "COMMUNICATIONS_ACCESS_ROLE_NOT_FOUND"
    )

    const userA =
      await prisma.user.create({
        data: {
          username:
            `operational-room-a-${nonce}`,

          email:
            `operational-room-a-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          viewedDocs:
            [],
        },
      })

    const userB =
      await prisma.user.create({
        data: {
          username:
            `operational-room-b-${nonce}`,

          email:
            `operational-room-b-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          viewedDocs:
            [],
        },
      })

    const userC =
      await prisma.user.create({
        data: {
          username:
            `operational-room-c-${nonce}`,

          email:
            `operational-room-c-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          viewedDocs:
            [],
        },
      })

    createdUserIds.push(
      userA.id,
      userB.id,
      userC.id
    )

    /*
     * Additional room members must possess a
     * live role granting COMMUNICATIONS_ACCESS.
     */
    await prisma.userRole.createMany({
      data: [
        {
          userId:
            userB.id,

          roleId:
            communicationsRole.id,

          isActive:
            true,
        },
        {
          userId:
            userC.id,

          roleId:
            communicationsRole.id,

          isActive:
            true,
        },
      ],
    })

    const principalA: Principal = {
      userId:
        userA.id,

      email:
        userA.email,

      roles: [
        "ADMIN_PLATFORM",
      ],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_GROUP_CREATE,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
        PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE,
      ],
    }

    const clientRoomId =
      `operational-room-client-${nonce}`

    const title =
      `Operational Room ${nonce}`

    /*
     * 1. First request must create exactly
     * one GROUP conversation and one room.
     */
    const first =
      await createOperationalRoomWithClient({
        client,
        principal:
          principalA,

        clientRoomId,

        title,

        roomClass:
          "GENERAL_OPERATIONS",

        memberUserIds: [
          userB.id,
          userC.id,
        ],
      })

    createdConversationIds.push(
      first.conversation.id
    )

    createdRoomIds.push(
      first.room.id
    )

    assert(
      first.conversation.kind ===
        "GROUP",
      "OPERATIONAL_ROOM_CONVERSATION_NOT_GROUP"
    )

    assert(
      first.conversation.title ===
        title,
      "OPERATIONAL_ROOM_TITLE_MISMATCH"
    )

    assert(
      first.room.roomClass ===
        "GENERAL_OPERATIONS",
      "OPERATIONAL_ROOM_CLASS_MISMATCH"
    )

    assert(
      first.conversation.members.length ===
        3,
      "OPERATIONAL_ROOM_MEMBER_COUNT_INVALID"
    )

    const ownerMembership =
      first.conversation.members.find(
        (
          member: {
            userId: string
            role: string
          }
        ) =>
          member.userId ===
          userA.id
      )

    assert(
      ownerMembership?.role ===
        "OWNER",
      "OPERATIONAL_ROOM_CREATOR_NOT_OWNER"
    )

    const memberB =
      first.conversation.members.find(
        (
          member: {
            userId: string
            role: string
          }
        ) =>
          member.userId ===
          userB.id
      )

    const memberC =
      first.conversation.members.find(
        (
          member: {
            userId: string
            role: string
          }
        ) =>
          member.userId ===
          userC.id
      )

    assert(
      memberB?.role ===
        "MEMBER" &&
        memberC?.role ===
          "MEMBER",
      "OPERATIONAL_ROOM_MEMBER_ROLE_INVALID"
    )

    /*
     * 2. Exact retry must resolve to the
     * original durable room and conversation.
     */
    const exactRetry =
      await createOperationalRoomWithClient({
        client,
        principal:
          principalA,

        clientRoomId,

        title,

        roomClass:
          "GENERAL_OPERATIONS",

        memberUserIds: [
          userB.id,
          userC.id,
        ],
      })

    assert(
      exactRetry.room.id ===
        first.room.id,
      "OPERATIONAL_ROOM_EXACT_RETRY_CREATED_NEW_ROOM"
    )

    assert(
      exactRetry.conversation.id ===
        first.conversation.id,
      "OPERATIONAL_ROOM_EXACT_RETRY_CREATED_NEW_CONVERSATION"
    )

    /*
     * 3. Member-order changes are not
     * materially different requests.
     */
    const reorderedRetry =
      await createOperationalRoomWithClient({
        client,
        principal:
          principalA,

        clientRoomId,

        title,

        roomClass:
          "GENERAL_OPERATIONS",

        memberUserIds: [
          userC.id,
          userB.id,
        ],
      })

    assert(
      reorderedRetry.room.id ===
        first.room.id,
      "OPERATIONAL_ROOM_MEMBER_ORDER_NOT_CANONICAL"
    )

    /*
     * There must still be exactly one durable
     * room under this actor-scoped client key.
     */
    const durableRoomCount =
      await prisma.communicationOperationalRoom.count({
        where: {
          createdByUserId:
            userA.id,

          clientRoomId,
        },
      })

    assert(
      durableRoomCount ===
        1,
      "OPERATIONAL_ROOM_IDEMPOTENCY_ROOM_COUNT_INVALID"
    )

    const durableConversationCount =
      await prisma.communicationConversation.count({
        where: {
          id:
            first.conversation.id,
        },
      })

    assert(
      durableConversationCount ===
        1,
      "OPERATIONAL_ROOM_IDEMPOTENCY_CONVERSATION_COUNT_INVALID"
    )

    /*
     * Creation retry must not emit duplicate
     * lifecycle events.
     */
    const conversationCreationEventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            first.conversation.id,

          eventType:
            "COMMUNICATION_CONVERSATION_CREATED",
        },
      })

    const roomCreationEventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_OPERATIONAL_ROOM",

          streamId:
            first.room.id,

          eventType:
            "COMMUNICATION_OPERATIONAL_ROOM_CREATED",
        },
      })

    assert(
      conversationCreationEventCount ===
        1,
      "OPERATIONAL_ROOM_DUPLICATE_CONVERSATION_EVENT"
    )

    assert(
      roomCreationEventCount ===
        1,
      "OPERATIONAL_ROOM_DUPLICATE_ROOM_EVENT"
    )

    /*
     * 4. Same client identity with changed
     * material content must collide.
     */
    let collisionBlocked =
      false

    try {
      await createOperationalRoomWithClient({
        client,
        principal:
          principalA,

        clientRoomId,

        title:
          `${title} changed`,

        roomClass:
          "GENERAL_OPERATIONS",

        memberUserIds: [
          userB.id,
          userC.id,
        ],
      })
    } catch (error: unknown) {
      collisionBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_OPERATIONAL_ROOM_IDEMPOTENCY_COLLISION"
    }

    assert(
      collisionBlocked,
      "OPERATIONAL_ROOM_IDEMPOTENCY_COLLISION_NOT_BLOCKED"
    )

    /*
     * 5. Concurrent identical creations must
     * converge on one durable room.
     */
    const concurrentClientRoomId =
      `operational-room-concurrent-${nonce}`

    const concurrentRequest = {
      client,
      principal:
        principalA,

      clientRoomId:
        concurrentClientRoomId,

      title:
        `Concurrent Operational Room ${nonce}`,

      roomClass:
        "GENERAL_OPERATIONS",

      memberUserIds: [
        userB.id,
        userC.id,
      ],
    }

    const [
      concurrentA,
      concurrentB,
    ] =
      await Promise.all([
        createOperationalRoomWithClient(
          concurrentRequest
        ),

        createOperationalRoomWithClient(
          concurrentRequest
        ),
      ])

    createdConversationIds.push(
      concurrentA.conversation.id
    )

    createdRoomIds.push(
      concurrentA.room.id
    )

    assert(
      concurrentA.room.id ===
        concurrentB.room.id,
      "OPERATIONAL_ROOM_CONCURRENT_RETRY_ROOM_DIVERGED"
    )

    assert(
      concurrentA.conversation.id ===
        concurrentB.conversation.id,
      "OPERATIONAL_ROOM_CONCURRENT_RETRY_CONVERSATION_DIVERGED"
    )

    const concurrentRoomCount =
      await prisma.communicationOperationalRoom.count({
        where: {
          createdByUserId:
            userA.id,

          clientRoomId:
            concurrentClientRoomId,
        },
      })

    assert(
      concurrentRoomCount ===
        1,
      "OPERATIONAL_ROOM_CONCURRENT_DUPLICATE_PERSISTED"
    )

    const concurrentRoomEventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_OPERATIONAL_ROOM",

          streamId:
            concurrentA.room.id,

          eventType:
            "COMMUNICATION_OPERATIONAL_ROOM_CREATED",
        },
      })

    assert(
      concurrentRoomEventCount ===
        1,
      "OPERATIONAL_ROOM_CONCURRENT_DUPLICATE_EVENT"
    )

    console.log(
      "✓ Operational Room creation idempotency smoke test passed"
    )

    console.log({
      firstCreation: {
        roomId:
          first.room.id,

        conversationId:
          first.conversation.id,

        groupTopology:
          true,

        creatorOwner:
          true,

        memberCount:
          first.conversation.members.length,
      },

      exactRetryCanonical:
        true,

      memberOrderCanonical:
        true,

      collisionBlocked:
        true,

      concurrentRetryCanonical:
        true,

      duplicateRoomPersisted:
        false,

      duplicateCreationEventPersisted:
        false,
    })
  } finally {
    if (
      createdRoomIds.length >
      0
    ) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamType:
            "COMMUNICATION_OPERATIONAL_ROOM",

          streamId: {
            in:
              createdRoomIds,
          },
        },
      })
    }

    if (
      createdConversationIds.length >
      0
    ) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId: {
            in:
              createdConversationIds,
          },
        },
      })

      /*
       * OperationalRoom cascades from
       * CommunicationConversation.
       */
      await prisma.communicationConversation.deleteMany({
        where: {
          id: {
            in:
              createdConversationIds,
          },
        },
      })
    }

    if (
      createdUserIds.length >
      0
    ) {
      /*
       * UserRole does not cascade from User,
       * so remove smoke grants first.
       */
      await prisma.userRole.deleteMany({
        where: {
          userId: {
            in:
              createdUserIds,
          },
        },
      })

      await prisma.user.deleteMany({
        where: {
          id: {
            in:
              createdUserIds,
          },
        },
      })
    }
  }
}

main()
  .catch(
    error => {
      console.error(error)
      process.exitCode = 1
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    }
  )
