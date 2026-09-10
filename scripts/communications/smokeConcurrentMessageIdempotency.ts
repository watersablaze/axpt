import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { createDirectConversationWithClient } from "../../src/domains/communications/conversations/createDirectConversationWithClient"
import { sendMessageWithClient } from "../../src/domains/communications/messages/sendMessageWithClient"

import type { CommunicationsDatabaseClient } from "../../src/domains/communications/shared/databaseTypes"

const prisma =
  new PrismaClient()

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
  let conversationId: string | null =
    null

  try {
    const userA =
      await prisma.user.create({
        data: {
          username:
            `communications-race-a-${nonce}`,
          email:
            `communications-race-a-${nonce}@axpt.local`,
          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",
          viewedDocs: [],
        },
      })

    const userB =
      await prisma.user.create({
        data: {
          username:
            `communications-race-b-${nonce}`,
          email:
            `communications-race-b-${nonce}@axpt.local`,
          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",
          viewedDocs: [],
        },
      })

    createdUserIds.push(
      userA.id,
      userB.id
    )

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
        PERMISSIONS.COMMUNICATIONS_DIRECT_CREATE,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
      ],
    }

    const principalB: Principal = {
      userId:
        userB.id,
      email:
        userB.email,
      roles: [
        "ADMIN_PLATFORM",
      ],
      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_DIRECT_CREATE,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
      ],
    }

    const conversation =
      await createDirectConversationWithClient({
        client,
        principal:
          principalA,
        otherUserId:
          userB.id,
      })

    conversationId =
      conversation.id

    /*
     * Ensure reverse canonicalization remains
     * valid before exercising the race.
     */
    await createDirectConversationWithClient({
      client,
      principal:
        principalB,
      otherUserId:
        userA.id,
    })

    const clientMessageId =
      `concurrent-message-${nonce}`

    const body =
      `concurrent-body-${nonce}`

    /*
     * Deliberately launch both logical copies
     * without awaiting the first.
     */
    const results =
      await Promise.allSettled([
        sendMessageWithClient({
          client,
          principal:
            principalA,
          conversationId:
            conversation.id,
          clientMessageId,
          body,
        }),

        sendMessageWithClient({
          client,
          principal:
            principalA,
          conversationId:
            conversation.id,
          clientMessageId,
          body,
        }),
      ])

    console.log(
      "Concurrent results:",
      results
    )

    const rejected =
      results.filter(
        result =>
          result.status ===
          "rejected"
      )

    assert(
      rejected.length === 0,
      "CONCURRENT_IDEMPOTENT_SEND_REJECTED"
    )

    const fulfilled =
      results.filter(
        (
          result
        ): result is PromiseFulfilledResult<
          Awaited<
            ReturnType<
              typeof sendMessageWithClient
            >
          >
        > =>
          result.status ===
          "fulfilled"
      )

    assert(
      fulfilled.length === 2,
      "CONCURRENT_SEND_RESULT_COUNT_INVALID"
    )

    assert(
      fulfilled[0].value.id ===
        fulfilled[1].value.id,
      "CONCURRENT_SEND_RETURNED_DIFFERENT_MESSAGES"
    )

    const messageCount =
      await prisma.communicationMessage.count({
        where: {
          conversationId:
            conversation.id,
          senderUserId:
            userA.id,
          clientMessageId,
        },
      })

    assert(
      messageCount === 1,
      "CONCURRENT_SEND_PERSISTED_DUPLICATE"
    )

    const eventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",
          streamId:
            conversation.id,
          eventType:
            "COMMUNICATION_MESSAGE_SENT",
        },
      })

    assert(
      eventCount === 1,
      "CONCURRENT_SEND_EMITTED_DUPLICATE_EVENT"
    )

    console.log(
      "✓ Concurrent Communications idempotency smoke passed"
    )

    console.log({
      bothRequestsResolved:
        true,
      sameDurableMessageReturned:
        true,
      duplicateMessagePrevented:
        true,
      duplicateEventPrevented:
        true,
    })
  } finally {
    if (conversationId) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",
          streamId:
            conversationId,
        },
      })

      await prisma.communicationConversation.deleteMany({
        where: {
          id:
            conversationId,
        },
      })
    }

    if (createdUserIds.length) {
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
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
