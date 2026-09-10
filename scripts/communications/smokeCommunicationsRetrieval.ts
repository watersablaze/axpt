import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { createDirectConversationWithClient } from "../../src/domains/communications/conversations/createDirectConversationWithClient"
import { listConversationsWithClient } from "../../src/domains/communications/conversations/listConversationsWithClient"
import { getConversationWithClient } from "../../src/domains/communications/conversations/getConversationWithClient"
import { sendMessageWithClient } from "../../src/domains/communications/messages/sendMessageWithClient"
import { listMessagesWithClient } from "../../src/domains/communications/messages/listMessagesWithClient"
import { markConversationReadWithClient } from "../../src/domains/communications/membership/markConversationReadWithClient"

import type { CommunicationsDatabaseClient } from "../../src/domains/communications/shared/databaseTypes"

const prisma = new PrismaClient()

type ConversationListRow = {
  id: string
  unreadCount: number
  operationalRoom:
    | {
        id: string
        roomClass: unknown
        links: Array<{
          id: string
          targetType: unknown
          targetSubtype: string
          targetId: string
          linkedAt: Date
        }>
      }
    | null
}

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

  try {
    const userA = await prisma.user.create({
      data: {
        username: `communications-retrieval-a-${nonce}`,
        email: `communications-retrieval-a-${nonce}@axpt.local`,
        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",
        viewedDocs: [],
      },
    })

    const userB = await prisma.user.create({
      data: {
        username: `communications-retrieval-b-${nonce}`,
        email: `communications-retrieval-b-${nonce}@axpt.local`,
        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",
        viewedDocs: [],
      },
    })

    const userC = await prisma.user.create({
      data: {
        username: `communications-retrieval-c-${nonce}`,
        email: `communications-retrieval-c-${nonce}@axpt.local`,
        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",
        viewedDocs: [],
      },
    })

    createdUserIds.push(
      userA.id,
      userB.id,
      userC.id
    )

    const permissions = [
      PERMISSIONS.COMMUNICATIONS_ACCESS,
      PERMISSIONS.COMMUNICATIONS_DIRECT_CREATE,
      PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
    ]

    const principalA: Principal = {
      userId: userA.id,
      email: userA.email,
      roles: ["ADMIN_PLATFORM"],
      permissions,
    }

    const principalB: Principal = {
      userId: userB.id,
      email: userB.email,
      roles: ["ADMIN_PLATFORM"],
      permissions,
    }

    const principalC: Principal = {
      userId: userC.id,
      email: userC.email,
      roles: ["ADMIN_PLATFORM"],
      permissions,
    }

    /*
     * Conversation 1: A ↔ B
     */
    const conversationAB =
      await createDirectConversationWithClient({
        client,
        principal: principalA,
        otherUserId: userB.id,
      })

    createdConversationIds.push(
      conversationAB.id
    )

    /*
     * Conversation 2: A ↔ C
     *
     * Used to prove read-marker isolation.
     */
    const conversationAC =
      await createDirectConversationWithClient({
        client,
        principal: principalA,
        otherUserId: userC.id,
      })

    createdConversationIds.push(
      conversationAC.id
    )

    /*
     * C2 retrieval fixture:
     *
     * A durable GROUP conversation with an
     * Operational Room and two pointer-only
     * institutional links.
     *
     * Creation/link command semantics are covered
     * by their dedicated C2 smokes. This fixture
     * isolates Communications retrieval behavior.
     */
    const operationalConversation =
      await prisma.communicationConversation.create({
        data: {
          kind:
            "GROUP",

          status:
            "ACTIVE",

          title:
            `Treasury Retrieval Room ${nonce}`,

          createdByUserId:
            userA.id,

          members: {
            create: [
              {
                userId:
                  userA.id,

                role:
                  "OWNER",
              },

              {
                userId:
                  userB.id,

                role:
                  "MEMBER",
              },
            ],
          },
        },
      })

    createdConversationIds.push(
      operationalConversation.id
    )

    const operationalRoom =
      await prisma.communicationOperationalRoom.create({
        data: {
          conversationId:
            operationalConversation.id,

          clientRoomId:
            `retrieval-room-${nonce}`,

          requestFingerprint:
            `retrieval-fingerprint-${nonce}`,

          roomClass:
            "TREASURY",

          createdByUserId:
            userA.id,
        },
      })

    const firstLinkedAt =
      new Date(
        Date.now() - 2_000
      )

    const secondLinkedAt =
      new Date(
        Date.now() - 1_000
      )

    const caseLink =
      await prisma.communicationOperationalLink.create({
        data: {
          roomId:
            operationalRoom.id,

          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            `case-retrieval-${nonce}`,

          linkedByUserId:
            userA.id,

          linkedAt:
            firstLinkedAt,
        },
      })

    const treasuryLink =
      await prisma.communicationOperationalLink.create({
        data: {
          roomId:
            operationalRoom.id,

          targetType:
            "TREASURY_GATEWAY_AGGREGATE",

          targetSubtype:
            "TREASURY_INSTRUCTION",

          targetId:
            `treasury-instruction-retrieval-${nonce}`,

          linkedByUserId:
            userA.id,

          linkedAt:
            secondLinkedAt,
        },
      })

    /*
     * Conversation listing boundaries.
     */
    const listA =
      await listConversationsWithClient({
        client,
        principal: principalA,
      })

    const listB =
      await listConversationsWithClient({
        client,
        principal: principalB,
      })

    const listC =
      await listConversationsWithClient({
        client,
        principal: principalC,
      })

    assert(
      listA.some(
        (conversation: ConversationListRow) =>
          conversation.id === conversationAB.id
      ),
      "A_CANNOT_LIST_AB_CONVERSATION"
    )

    assert(
      listB.some(
        (conversation: ConversationListRow) =>
          conversation.id === conversationAB.id
      ),
      "B_CANNOT_LIST_AB_CONVERSATION"
    )

    assert(
      !listC.some(
        (conversation: ConversationListRow) =>
          conversation.id === conversationAB.id
      ),
      "C_CAN_LIST_UNAUTHORIZED_AB_CONVERSATION"
    )

    /*
     * Conversation detail boundary.
     */
    const fetchedAB =
      await getConversationWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
      })

    assert(
      fetchedAB.id === conversationAB.id,
      "MEMBER_CANNOT_GET_CONVERSATION"
    )

    let nonMemberGetBlocked = false

    try {
      await getConversationWithClient({
        client,
        principal: principalC,
        conversationId: conversationAB.id,
      })
    } catch (error: unknown) {
      nonMemberGetBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    }

    assert(
      nonMemberGetBlocked,
      "NON_MEMBER_GET_NOT_BLOCKED"
    )

    /*
     * Create ordered message history.
     */
    const message1 =
      await sendMessageWithClient({
        client,
        principal: principalA,
        conversationId: conversationAB.id,
        clientMessageId:
          `communications-smoke-smokeCommunicationsRetrieval-1-${nonce}`,
        body: `message-1-${nonce}`,
      })

    await new Promise(
      (resolve) => setTimeout(resolve, 5)
    )

    const message2 =
      await sendMessageWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        clientMessageId:
          `communications-smoke-smokeCommunicationsRetrieval-2-${nonce}`,
        body: `message-2-${nonce}`,
      })

    await new Promise(
      (resolve) => setTimeout(resolve, 5)
    )

    const message3 =
      await sendMessageWithClient({
        client,
        principal: principalA,
        conversationId: conversationAB.id,
        clientMessageId:
          `communications-smoke-smokeCommunicationsRetrieval-3-${nonce}`,
        body: `message-3-${nonce}`,
      })

    /*
     * Newest-first retrieval.
     */
    const messages =
      await listMessagesWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        limit: 10,
      })

    assert(
      messages.length === 3,
      "MESSAGE_LIST_COUNT_INVALID"
    )

    assert(
      messages[0]?.id === message3.id &&
      messages[1]?.id === message2.id &&
      messages[2]?.id === message1.id,
      "MESSAGE_ORDER_INVALID"
    )

    /*
     * Cursor pagination.
     */
    const page1 =
      await listMessagesWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        limit: 2,
      })

    assert(
      page1.length === 2,
      "MESSAGE_PAGE_1_COUNT_INVALID"
    )

    const page2 =
      await listMessagesWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        cursor: page1[1]!.id,
        limit: 2,
      })

    assert(
      page2.length === 1,
      "MESSAGE_PAGE_2_COUNT_INVALID"
    )

    assert(
      page2[0]?.id === message1.id,
      "MESSAGE_CURSOR_PAGINATION_INVALID"
    )

    /*
     * Before any read marker, B has two
     * incoming unread messages from A.
     *
     * B's own message2 must not count.
     */
    const unreadBeforeRead =
      await listConversationsWithClient({
        client,
        principal: principalB,
      })

    const unreadBeforeReadAB =
      unreadBeforeRead.find(
        (conversation: ConversationListRow) =>
          conversation.id ===
          conversationAB.id
      )

    assert(
      unreadBeforeReadAB?.unreadCount === 2,
      "INITIAL_INCOMING_UNREAD_COUNT_INVALID"
    )

    /*
     * Initial read advance.
     */
    const readThrough2 =
      await markConversationReadWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        throughMessageId: message2.id,
      })

    assert(
      readThrough2.lastReadMessageId ===
        message2.id,
      "READ_MARKER_NOT_UPDATED"
    )

    assert(
      readThrough2.lastReadAt !== null,
      "READ_TIMESTAMP_NOT_UPDATED"
    )

    /*
     * After reading through message2,
     * message3 from A remains unread.
     */
    const unreadAfterRead2 =
      await listConversationsWithClient({
        client,
        principal: principalB,
      })

    const unreadAfterRead2AB =
      unreadAfterRead2.find(
        (conversation: ConversationListRow) =>
          conversation.id ===
          conversationAB.id
      )

    assert(
      unreadAfterRead2AB?.unreadCount === 1,
      "INCOMING_UNREAD_AFTER_READ_MARKER_INVALID"
    )

    /*
     * B now sends a newer self-authored message.
     *
     * The old UI heuristic would incorrectly
     * report the conversation as read because
     * the latest message belongs to B.
     *
     * Authoritative unread state must remain 1.
     */
    await new Promise(
      (resolve) => setTimeout(resolve, 5)
    )

    const message4 =
      await sendMessageWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        clientMessageId:
          `communications-smoke-smokeCommunicationsRetrieval-4-${nonce}`,
        body: `message-4-${nonce}`,
      })

    const unreadAfterSelfSend =
      await listConversationsWithClient({
        client,
        principal: principalB,
      })

    const unreadAfterSelfSendAB =
      unreadAfterSelfSend.find(
        (conversation: ConversationListRow) =>
          conversation.id ===
          conversationAB.id
      )

    assert(
      unreadAfterSelfSendAB?.unreadCount === 1,
      "OLDER_UNREAD_LOST_AFTER_NEWER_SELF_SEND"
    )

    /*
     * Advance through the newest message.
     * This places message3 behind the read marker
     * and must clear the remaining incoming unread.
     */
    const readThrough4 =
      await markConversationReadWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        throughMessageId: message4.id,
      })

    assert(
      readThrough4.lastReadMessageId ===
        message4.id,
      "READ_MARKER_DID_NOT_ADVANCE"
    )

    const unreadAfterAdvance =
      await listConversationsWithClient({
        client,
        principal: principalB,
      })

    const unreadAfterAdvanceAB =
      unreadAfterAdvance.find(
        (conversation: ConversationListRow) =>
          conversation.id ===
          conversationAB.id
      )

    assert(
      unreadAfterAdvanceAB?.unreadCount === 0,
      "READ_MARKER_DID_NOT_CLEAR_UNREAD"
    )

    /*
     * A self-authored message after a clean
     * read marker must not create unread state.
     */
    await new Promise(
      (resolve) => setTimeout(resolve, 5)
    )

    await sendMessageWithClient({
      client,
      principal: principalB,
      conversationId: conversationAB.id,
      clientMessageId:
        `communications-smoke-smokeCommunicationsRetrieval-5-${nonce}`,
      body: `message-5-${nonce}`,
    })

    const unreadAfterSelfOnly =
      await listConversationsWithClient({
        client,
        principal: principalB,
      })

    const unreadAfterSelfOnlyAB =
      unreadAfterSelfOnly.find(
        (conversation: ConversationListRow) =>
          conversation.id ===
          conversationAB.id
      )

    assert(
      unreadAfterSelfOnlyAB?.unreadCount === 0,
      "SELF_SENT_MESSAGE_COUNTED_AS_UNREAD"
    )

    /*
     * Regression must be rejected.
     */
    let regressionBlocked = false

    try {
      await markConversationReadWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        throughMessageId: message1.id,
      })
    } catch (error: unknown) {
      regressionBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_READ_STATE_REGRESSION_NOT_ALLOWED"
    }

    assert(
      regressionBlocked,
      "READ_STATE_REGRESSION_NOT_BLOCKED"
    )

    /*
     * Message from another conversation cannot
     * become this conversation's read marker.
     */
    const foreignMessage =
      await sendMessageWithClient({
        client,
        principal: principalA,
        conversationId: conversationAC.id,
        clientMessageId:
          `communications-smoke-smokeCommunicationsRetrieval-6-${nonce}`,
        body: `foreign-message-${nonce}`,
      })

    let foreignMarkerBlocked = false

    try {
      await markConversationReadWithClient({
        client,
        principal: principalB,
        conversationId: conversationAB.id,
        throughMessageId: foreignMessage.id,
      })
    } catch (error: unknown) {
      foreignMarkerBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_READ_MESSAGE_NOT_FOUND"
    }

    assert(
      foreignMarkerBlocked,
      "FOREIGN_MESSAGE_ACCEPTED_AS_READ_MARKER"
    )

    /*
     * Non-member cannot list messages either.
     */
    let nonMemberMessagesBlocked = false

    try {
      await listMessagesWithClient({
        client,
        principal: principalC,
        conversationId: conversationAB.id,
      })
    } catch (error: unknown) {
      nonMemberMessagesBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    }

    assert(
      nonMemberMessagesBlocked,
      "NON_MEMBER_MESSAGE_LIST_NOT_BLOCKED"
    )

    /*
     * ──────────────────────────────────────────
     * C2 — OPERATIONAL ROOM RETRIEVAL
     * ──────────────────────────────────────────
     */

    /*
     * DIRECT conversations have no operational
     * room projection at the domain read layer.
     */
    const directDetail =
      await getConversationWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversationAB.id,
      })

    assert(
      directDetail.operationalRoom ===
        null,
      "DIRECT_CONVERSATION_OPERATIONAL_ROOM_NOT_NULL"
    )

    /*
     * Active operational room is discoverable by
     * an active member, with its room class and
     * links preserved.
     */
    const operationalListB =
      await listConversationsWithClient({
        client,
        principal:
          principalB,
      })

    const operationalListRow =
      operationalListB.find(
        (conversation: ConversationListRow) =>
          conversation.id ===
          operationalConversation.id
      )

    assert(
      operationalListRow !==
        undefined,
      "ACTIVE_OPERATIONAL_ROOM_NOT_LISTED_FOR_MEMBER"
    )

    assert(
      operationalListRow.operationalRoom !==
        null,
      "ACTIVE_OPERATIONAL_ROOM_METADATA_MISSING"
    )

    assert(
      operationalListRow.operationalRoom.roomClass ===
        "TREASURY",
      "ACTIVE_OPERATIONAL_ROOM_CLASS_INVALID"
    )

    assert(
      operationalListRow.operationalRoom.links.length ===
        2,
      "ACTIVE_OPERATIONAL_ROOM_LINK_COUNT_INVALID"
    )

    assert(
      operationalListRow.operationalRoom.links[0]?.id ===
        caseLink.id &&
        operationalListRow.operationalRoom.links[1]?.id ===
          treasuryLink.id,
      "OPERATIONAL_ROOM_LINK_ORDER_INVALID"
    )

    const operationalDetail =
      await getConversationWithClient({
        client,
        principal:
          principalB,
        conversationId:
          operationalConversation.id,
      })

    assert(
      operationalDetail.operationalRoom?.id ===
        operationalRoom.id,
      "OPERATIONAL_ROOM_DETAIL_METADATA_MISSING"
    )

    assert(
      operationalDetail.operationalRoom.links.length ===
        2,
      "OPERATIONAL_ROOM_DETAIL_LINKS_MISSING"
    )

    /*
     * Retrieval remains pointer-only.
     *
     * Communications receives institutional
     * coordinates, not hydrated Case / Dossier /
     * Transaction / Treasury aggregate state.
     */
    for (
      const link of
      operationalDetail.operationalRoom.links
    ) {
      const record =
        link as unknown as Record<
          string,
          unknown
        >

      assert(
        !(
          "case" in
          record
        ),
        "OPERATIONAL_RETRIEVAL_HYDRATED_CASE"
      )

      assert(
        !(
          "opportunity" in
          record
        ),
        "OPERATIONAL_RETRIEVAL_HYDRATED_OPPORTUNITY"
      )

      assert(
        !(
          "transactionDossier" in
          record
        ),
        "OPERATIONAL_RETRIEVAL_HYDRATED_DOSSIER"
      )

      assert(
        !(
          "transaction" in
          record
        ),
        "OPERATIONAL_RETRIEVAL_HYDRATED_TRANSACTION"
      )

      assert(
        !(
          "treasuryGatewayAggregate" in
          record
        ),
        "OPERATIONAL_RETRIEVAL_HYDRATED_TREASURY"
      )
    }

    /*
     * Archive changes operational availability,
     * not institutional-record visibility.
     */
    await prisma.communicationConversation.update({
      where: {
        id:
          operationalConversation.id,
      },

      data: {
        status:
          "ARCHIVED",

        archivedAt:
          new Date(),
      },
    })

    const archivedListB =
      await listConversationsWithClient({
        client,
        principal:
          principalB,
      })

    const archivedOperationalRow =
      archivedListB.find(
        (conversation: ConversationListRow) =>
          conversation.id ===
          operationalConversation.id
      )

    assert(
      archivedOperationalRow !==
        undefined,
      "ARCHIVED_OPERATIONAL_ROOM_NOT_RETRIEVABLE"
    )

    assert(
      archivedOperationalRow.operationalRoom !==
        null,
      "ARCHIVED_OPERATIONAL_ROOM_METADATA_MISSING"
    )

    assert(
      archivedOperationalRow.operationalRoom.id ===
        operationalRoom.id,
      "ARCHIVED_OPERATIONAL_ROOM_ID_INVALID"
    )

    assert(
      archivedOperationalRow.operationalRoom.links.length ===
        2,
      "ARCHIVED_OPERATIONAL_ROOM_LINKS_LOST"
    )

    const archivedOperationalDetail =
      await getConversationWithClient({
        client,
        principal:
          principalB,
        conversationId:
          operationalConversation.id,
      })

    assert(
      archivedOperationalDetail.operationalRoom?.id ===
        operationalRoom.id,
      "ARCHIVED_OPERATIONAL_ROOM_DETAIL_NOT_RETRIEVABLE"
    )

    /*
     * Revocation removes authority regardless of
     * the room being retained as an archive.
     */
    await prisma.communicationMember.updateMany({
      where: {
        conversationId:
          operationalConversation.id,

        userId:
          userB.id,

        leftAt:
          null,
      },

      data: {
        leftAt:
          new Date(),
      },
    })

    const revokedListB =
      await listConversationsWithClient({
        client,
        principal:
          principalB,
      })

    assert(
      !revokedListB.some(
        (conversation: ConversationListRow) =>
          conversation.id ===
          operationalConversation.id
      ),
      "REVOKED_MEMBER_CAN_LIST_OPERATIONAL_ROOM"
    )

    let revokedDetailBlocked =
      false

    try {
      await getConversationWithClient({
        client,
        principal:
          principalB,
        conversationId:
          operationalConversation.id,
      })
    } catch (error: unknown) {
      revokedDetailBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    }

    assert(
      revokedDetailBlocked,
      "REVOKED_MEMBER_CAN_GET_OPERATIONAL_ROOM"
    )

    console.log(
      "✓ Communications retrieval smoke passed"
    )

    console.log({
      memberConversationListing:
        true,

      nonMemberConversationHidden:
        true,

      conversationAccessBoundary:
        true,

      deterministicMessageOrder:
        true,

      cursorPagination:
        true,

      incomingUnreadCounted:
        true,

      selfSentMessageNotUnread:
        true,

      olderUnreadSurvivesNewerSelfSend:
        true,

      readMarkerClearsUnread:
        true,

      readMarkerUpdated:
        true,

      readStateAdvanced:
        true,

      readStateRegressionBlocked:
        true,

      foreignReadMarkerBlocked:
        true,

      nonMemberMessageListingBlocked:
        true,

      directOperationalRoomNull:
        true,

      activeOperationalRoomRetrievable:
        true,

      operationalRoomClassPreserved:
        true,

      operationalLinksOrdered:
        true,

      operationalTargetsPointerOnly:
        true,

      archivedOperationalRoomRetrievable:
        true,

      revokedOperationalRoomHidden:
        true,

      revokedOperationalRoomDetailBlocked:
        true,
    })
  } finally {
    if (createdConversationIds.length > 0) {
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

      await prisma.communicationConversation.deleteMany({
        where: {
          id: {
            in:
              createdConversationIds,
          },
        },
      })
    }

    if (createdUserIds.length > 0) {
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
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
