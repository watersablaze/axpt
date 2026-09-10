import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { archiveConversationWithClient } from "../../src/domains/communications/conversations/archiveConversationWithClient"
import { createDirectConversationWithClient } from "../../src/domains/communications/conversations/createDirectConversationWithClient"
import { getConversationWithClient } from "../../src/domains/communications/conversations/getConversationWithClient"
import { listConversationsWithClient } from "../../src/domains/communications/conversations/listConversationsWithClient"
import { listMessagesWithClient } from "../../src/domains/communications/messages/listMessagesWithClient"
import { sendMessageWithClient } from "../../src/domains/communications/messages/sendMessageWithClient"
import { markConversationReadWithClient } from "../../src/domains/communications/membership/markConversationReadWithClient"
import { loadCommunicationRealtimeSignalsWithClient } from "../../src/domains/communications/realtime/loadCommunicationRealtimeSignalsWithClient"

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
            `communications-archive-a-${nonce}`,
          email:
            `communications-archive-a-${nonce}@axpt.local`,
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
            `communications-archive-b-${nonce}`,
          email:
            `communications-archive-b-${nonce}@axpt.local`,
          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",
          viewedDocs:
            [],
        },
      })

    createdUserIds.push(
      userA.id,
      userB.id
    )

    const permissions = [
      PERMISSIONS.COMMUNICATIONS_ACCESS,
      PERMISSIONS.COMMUNICATIONS_DIRECT_CREATE,
      PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
      PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE,
    ]

    const principalA: Principal = {
      userId:
        userA.id,
      email:
        userA.email,
      roles:
        ["ADMIN_PLATFORM"],
      permissions,
    }

    const principalB: Principal = {
      userId:
        userB.id,
      email:
        userB.email,
      roles:
        ["ADMIN_PLATFORM"],
      permissions,
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

    const originalClientMessageId =
      `archive-original-${nonce}`

    const originalMessage =
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversation.id,
        clientMessageId:
          originalClientMessageId,
        body:
          `archive-original-${nonce}`,
      })

    /*
     * Archive through the canonical governed
     * room-state command.
     */
    await archiveConversationWithClient({
      client,
      principal:
        principalA,
      conversationId:
        conversation.id,
    })

    const listed =
      await listConversationsWithClient({
        client,
        principal:
          principalB,
      })

    const listedArchived =
      listed.find(
        item =>
          item.id ===
          conversation.id
      )

    assert(
      listedArchived !== undefined,
      "ARCHIVED_CONVERSATION_NOT_LISTED"
    )

    assert(
      listedArchived.status ===
        "ARCHIVED",
      "ARCHIVED_STATUS_NOT_PROJECTED"
    )

    const detail =
      await getConversationWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
      })

    assert(
      detail.id ===
        conversation.id,
      "ARCHIVED_DETAIL_NOT_READABLE"
    )

    const messages =
      await listMessagesWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
      })

    const originalVisible =
      messages.some(
        (
          item: {
            id: string
          }
        ) =>
          item.id ===
          originalMessage.id
      )

    assert(
      originalVisible,
      "ARCHIVED_HISTORY_NOT_READABLE"
    )

    await markConversationReadWithClient({
      client,
      principal:
        principalB,
      conversationId:
        conversation.id,
      throughMessageId:
        originalMessage.id,
    })

    const membership =
      await prisma.communicationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId:
              conversation.id,
            userId:
              userB.id,
          },
        },
      })

    assert(
      membership?.lastReadMessageId ===
        originalMessage.id,
      "ARCHIVED_READ_MARKER_NOT_ALLOWED"
    )

    /*
     * Retry of a message committed before archival
     * must remain idempotently recoverable.
     */
    const retry =
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversation.id,
        clientMessageId:
          originalClientMessageId,
        body:
          `archive-original-${nonce}`,
      })

    assert(
      retry.id ===
        originalMessage.id,
      "ARCHIVED_IDEMPOTENT_RETRY_BROKEN"
    )

    const blockedClientMessageId =
      `archive-blocked-${nonce}`

    let archivedSendBlocked =
      false

    try {
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversation.id,
        clientMessageId:
          blockedClientMessageId,
        body:
          "THIS MUST NOT PERSIST",
      })
    } catch (error: unknown) {
      archivedSendBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ARCHIVED"
    }

    assert(
      archivedSendBlocked,
      "ARCHIVED_SEND_NOT_BLOCKED"
    )

    const blockedMessageCount =
      await prisma.communicationMessage.count({
        where: {
          conversationId:
            conversation.id,
          senderUserId:
            userA.id,
          clientMessageId:
            blockedClientMessageId,
        },
      })

    assert(
      blockedMessageCount === 0,
      "ARCHIVED_MESSAGE_PERSISTED"
    )

    const blockedEventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",
          streamId:
            conversation.id,
          eventType:
            "COMMUNICATION_MESSAGE_SENT",
          payload: {
            path: [
              "senderUserId",
            ],
            equals:
              userA.id,
          },
          occurredAt: {
            gt:
              originalMessage.createdAt,
          },
        },
      })

    assert(
      blockedEventCount === 0,
      "ARCHIVED_MESSAGE_EVENT_PERSISTED"
    )

    /*
     * Archive removes the room from operational
     * realtime even when historical events fall
     * inside the requested realtime window.
     */
    const archivedRealtimeRecords =
      await loadCommunicationRealtimeSignalsWithClient({
        client,
        principal:
          principalB,
        since:
          new Date(
            originalMessage.createdAt.getTime() -
              60_000
          ),
      })

    const archivedRealtimeVisible =
      archivedRealtimeRecords.some(
        (record) =>
          record.signal.conversationId ===
          conversation.id
      )

    assert(
      !archivedRealtimeVisible,
      "ARCHIVED_CONVERSATION_REALTIME_VISIBLE"
    )

    console.log(
      "✓ Communications archive semantics smoke passed"
    )

    console.log({
      archivedConversationListed:
        true,
      archivedStatusProjected:
        true,
      archivedDetailReadable:
        true,
      archivedHistoryReadable:
        true,
      archivedReadMarkerAllowed:
        true,
      archivedIdempotentRetryPreserved:
        true,
      archivedNewSendBlocked:
        true,
      archivedMessagePersisted:
        false,
      archivedMessageEventPersisted:
        false,
      archivedRealtimeHidden:
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
