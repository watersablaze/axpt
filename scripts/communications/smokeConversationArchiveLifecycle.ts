import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { createDirectConversationWithClient } from "../../src/domains/communications/conversations/createDirectConversationWithClient"
import { getConversationWithClient } from "../../src/domains/communications/conversations/getConversationWithClient"
import { listConversationsWithClient } from "../../src/domains/communications/conversations/listConversationsWithClient"
import { listMessagesWithClient } from "../../src/domains/communications/messages/listMessagesWithClient"
import { sendMessageWithClient } from "../../src/domains/communications/messages/sendMessageWithClient"
import { markConversationReadWithClient } from "../../src/domains/communications/membership/markConversationReadWithClient"

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

  const createdUserIds: string[] =
    []

  let conversationId:
    string | null =
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

    /*
     * Establish an ACTIVE room and one durable
     * message before archival.
     */
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

    const originalBody =
      `archive original ${nonce}`

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
          originalBody,
      })

    const messageEventCountBeforeArchive =
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

    /*
     * Archive governs the room state.
     * Membership remains unchanged.
     */
    const archivedAt =
      new Date()

    await prisma.communicationConversation.update({
      where: {
        id:
          conversation.id,
      },
      data: {
        status:
          "ARCHIVED",
        archivedAt,
      },
    })

    /*
     * Archived rooms remain discoverable to
     * active members.
     */
    const archivedList =
      await listConversationsWithClient({
        client,
        principal:
          principalB,
      })

    const listedArchive =
      archivedList.find(
        (
          item: {
            id: string
            status: unknown
          }
        ) =>
          item.id ===
          conversation.id
      )

    assert(
      listedArchive !== undefined,
      "ARCHIVED_CONVERSATION_NOT_LISTED"
    )

    assert(
      listedArchive.status ===
        "ARCHIVED",
      "ARCHIVED_CONVERSATION_STATUS_NOT_PROJECTED"
    )

    /*
     * Detail remains readable.
     */
    const archivedDetail =
      await getConversationWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
      })

    assert(
      archivedDetail.id ===
        conversation.id,
      "ARCHIVED_CONVERSATION_DETAIL_DENIED"
    )

    assert(
      archivedDetail.status ===
        "ARCHIVED",
      "ARCHIVED_DETAIL_STATUS_INCORRECT"
    )

    /*
     * Existing history remains readable.
     */
    const archivedMessages =
      await listMessagesWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
      })

    assert(
      archivedMessages.some(
        (
          item: {
            id: string
          }
        ) =>
          item.id ===
          originalMessage.id
      ),
      "ARCHIVED_HISTORY_NOT_READABLE"
    )

    /*
     * Read state may still advance against
     * retained institutional history.
     */
    const readMembership =
      await markConversationReadWithClient({
        client,
        principal:
          principalB,
        conversationId:
          conversation.id,
        throughMessageId:
          originalMessage.id,
      })

    assert(
      readMembership.lastReadMessageId ===
        originalMessage.id,
      "ARCHIVED_READ_MARKER_NOT_ADVANCED"
    )

    /*
     * Reliability invariant:
     *
     * A retry for an operation that already
     * committed before archival must still
     * resolve to the original durable message.
     */
    const idempotentRetry =
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversation.id,
        clientMessageId:
          originalClientMessageId,
        body:
          originalBody,
      })

    assert(
      idempotentRetry.id ===
        originalMessage.id,
      "ARCHIVE_BROKE_PREVIOUS_IDEMPOTENT_RETRY"
    )

    /*
     * New persistence after archive is forbidden.
     */
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
      "ARCHIVED_NEW_SEND_NOT_BLOCKED"
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

    const messageEventCountAfterBlockedSend =
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
      messageEventCountAfterBlockedSend ===
        messageEventCountBeforeArchive,
      "ARCHIVED_SEND_CREATED_MESSAGE_EVENT"
    )

    const membershipStillActive =
      await prisma.communicationMember.findFirst({
        where: {
          conversationId:
            conversation.id,
          userId:
            userB.id,
          leftAt:
            null,
        },
      })

    assert(
      membershipStillActive !== null,
      "ARCHIVE_MUTATED_MEMBER_AUTHORITY"
    )

    console.log(
      "✓ Communications archive lifecycle smoke passed"
    )

    console.log({
      archivedConversationListed:
        true,
      archivedDetailReadable:
        true,
      archivedHistoryReadable:
        true,
      archivedReadMarkerAllowed:
        true,
      preArchiveIdempotentRetryPreserved:
        true,
      archivedNewSendBlocked:
        true,
      archivedMessagePersisted:
        false,
      archivedMessageEventPersisted:
        false,
      membershipPreserved:
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

    if (
      createdUserIds.length >
      0
    ) {
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
      process.exitCode =
        1
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    }
  )
