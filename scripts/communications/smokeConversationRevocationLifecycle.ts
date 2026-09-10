import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

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

function isAccessDenied(
  error: unknown
) {
  return (
    error instanceof Error &&
    error.message ===
      "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
  )
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
            `communications-revocation-a-${nonce}`,
          email:
            `communications-revocation-a-${nonce}@axpt.local`,
          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",
          viewedDocs: [],
        },
      })

    const userB =
      await prisma.user.create({
        data: {
          username:
            `communications-revocation-b-${nonce}`,
          email:
            `communications-revocation-b-${nonce}@axpt.local`,
          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",
          viewedDocs: [],
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
    ]

    const principalA: Principal = {
      userId:
        userA.id,
      email:
        userA.email,
      roles: [
        "ADMIN_PLATFORM",
      ],
      permissions,
    }

    const principalB: Principal = {
      userId:
        userB.id,
      email:
        userB.email,
      roles: [
        "ADMIN_PLATFORM",
      ],
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

    const message =
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversation.id,
        clientMessageId:
          `revocation-before-${nonce}`,
        body:
          `revocation-before-${nonce}`,
      })

    const beforeList =
      await listConversationsWithClient({
        client,
        principal:
          principalB,
      })

    assert(
      beforeList.some(
        item =>
          item.id ===
          conversation.id
      ),
      "ACTIVE_MEMBER_CONVERSATION_NOT_LISTED"
    )

    const beforeDetail =
      await getConversationWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
      })

    assert(
      beforeDetail.id ===
        conversation.id,
      "ACTIVE_MEMBER_CONVERSATION_DETAIL_DENIED"
    )

    const beforeMessages =
      await listMessagesWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
      })

    assert(
      beforeMessages.some(
        (
          item: {
            id: string
          }
        ) =>
          item.id === message.id
      ),
      "ACTIVE_MEMBER_MESSAGES_DENIED"
    )

    await markConversationReadWithClient({
      client,
      principal:
        principalB,
      conversationId:
        conversation.id,
      throughMessageId:
        message.id,
    })

    /*
     * Membership revocation.
     */
    await prisma.communicationMember.update({
      where: {
        conversationId_userId: {
          conversationId:
            conversation.id,
          userId:
            userB.id,
        },
      },
      data: {
        leftAt:
          new Date(),
      },
    })

    const afterList =
      await listConversationsWithClient({
        client,
        principal:
          principalB,
      })

    assert(
      !afterList.some(
        item =>
          item.id ===
          conversation.id
      ),
      "REVOKED_CONVERSATION_STILL_LISTED"
    )

    let detailDenied = false

    try {
      await getConversationWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
      })
    } catch (error) {
      detailDenied =
        isAccessDenied(error)
    }

    assert(
      detailDenied,
      "REVOKED_CONVERSATION_DETAIL_NOT_BLOCKED"
    )

    let messagesDenied = false

    try {
      await listMessagesWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
      })
    } catch (error) {
      messagesDenied =
        isAccessDenied(error)
    }

    assert(
      messagesDenied,
      "REVOKED_MESSAGE_LIST_NOT_BLOCKED"
    )

    let readDenied = false

    try {
      await markConversationReadWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
        throughMessageId:
          message.id,
      })
    } catch (error) {
      readDenied =
        isAccessDenied(error)
    }

    assert(
      readDenied,
      "REVOKED_READ_MARKER_NOT_BLOCKED"
    )

    let sendDenied = false

    try {
      await sendMessageWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
        clientMessageId:
          `revocation-after-${nonce}`,
        body:
          "THIS MUST NOT PERSIST",
      })
    } catch (error) {
      sendDenied =
        isAccessDenied(error)
    }

    assert(
      sendDenied,
      "REVOKED_SEND_NOT_BLOCKED"
    )

    const unauthorizedMessageCount =
      await prisma.communicationMessage.count({
        where: {
          conversationId:
            conversation.id,
          senderUserId:
            userB.id,
          clientMessageId:
            `revocation-after-${nonce}`,
        },
      })

    assert(
      unauthorizedMessageCount === 0,
      "REVOKED_MESSAGE_PERSISTED"
    )

    /*
     * New signal exists after revocation.
     */
    await sendMessageWithClient({
      client,
      principal:
        principalA,
      conversationId:
        conversation.id,
      clientMessageId:
        `revocation-signal-${nonce}`,
      body:
        `revocation-signal-${nonce}`,
    })

    const realtimeSignals =
      await loadCommunicationRealtimeSignalsWithClient({
        client,
        principal:
          principalB,
        since:
          new Date(
            Date.now() - 60_000
          ),
      })

    assert(
      !realtimeSignals.some(
        (record) =>
          record.signal.conversationId ===
          conversation.id
      ),
      "REVOKED_REALTIME_SIGNAL_VISIBLE"
    )

    console.log(
      "✓ Communications revocation lifecycle smoke passed"
    )

    console.log({
      activeConversationListed:
        true,
      activeDetailReadable:
        true,
      activeMessagesReadable:
        true,
      revokedConversationHidden:
        true,
      revokedDetailBlocked:
        true,
      revokedMessagesBlocked:
        true,
      revokedReadBlocked:
        true,
      revokedSendBlocked:
        true,
      revokedMessagePersisted:
        false,
      revokedRealtimeHidden:
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
