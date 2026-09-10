import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { createDirectConversationWithClient } from "../../src/domains/communications/conversations/createDirectConversationWithClient"
import { sendMessageWithClient } from "../../src/domains/communications/messages/sendMessageWithClient"
import { loadCommunicationRealtimeSignalsWithClient } from "../../src/domains/communications/realtime/loadCommunicationRealtimeSignalsWithClient"

import type { CommunicationsDatabaseClient } from "../../src/domains/communications/shared/databaseTypes"

const prisma =
  new PrismaClient()

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      message
    )
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

  let conversationId:
    string | null = null

  try {
    const userA =
      await prisma.user.create({
        data: {
          username:
            `communications-realtime-a-${nonce}`,

          email:
            `communications-realtime-a-${nonce}@axpt.local`,

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
            `communications-realtime-b-${nonce}`,

          email:
            `communications-realtime-b-${nonce}@axpt.local`,

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
            `communications-realtime-c-${nonce}`,

          email:
            `communications-realtime-c-${nonce}@axpt.local`,

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

      roles: [],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
      ],
    }

    /*
     * C has platform Communications access,
     * but is not a conversation member.
     */
    const principalC: Principal = {
      userId:
        userC.id,

      email:
        userC.email,

      roles: [],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
      ],
    }

    const since =
      new Date(
        Date.now() - 5000
      )

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

    const secretBody =
      `PRIVATE-BODY-${nonce}`

    const message =
      await sendMessageWithClient({
        client,

        principal:
          principalA,

        conversationId:
          conversation.id,

          clientMessageId:
            `communications-realtime-${nonce}`,

        body:
          secretBody,
      })

    /*
     * Active member receives the conversation
     * realtime signal.
     */
    const memberRecords =
      await loadCommunicationRealtimeSignalsWithClient({
        client,

        principal:
          principalB,

        since,
      })

    const messageRecord =
      memberRecords.find(
        (record) =>
          record.signal.type ===
            "COMMUNICATION_MESSAGE_SENT" &&
          record.signal.conversationId ===
            conversation.id
      )

    assert(
      messageRecord !== undefined,
      "REALTIME_MEMBER_MESSAGE_SIGNAL_NOT_FOUND"
    )

    if (
      messageRecord.signal.messageId
    ) {
      assert(
        messageRecord.signal.messageId ===
          message.id,
        "REALTIME_MESSAGE_ID_MISMATCH"
      )
    }

    /*
     * Thin signal must not expose content or
     * arbitrary event metadata.
     */
    const serializedSignal =
      JSON.stringify(
        messageRecord.signal
      )

    assert(
      !serializedSignal.includes(
        secretBody
      ),
      "REALTIME_MESSAGE_BODY_LEAKED"
    )

    assert(
      !Object.prototype.hasOwnProperty.call(
        messageRecord.signal,
        "body"
      ),
      "REALTIME_SIGNAL_HAS_BODY_FIELD"
    )

    assert(
      !Object.prototype.hasOwnProperty.call(
        messageRecord.signal,
        "metadata"
      ),
      "REALTIME_SIGNAL_HAS_METADATA_FIELD"
    )

    assert(
      !Object.prototype.hasOwnProperty.call(
        messageRecord.signal,
        "payload"
      ),
      "REALTIME_SIGNAL_HAS_RAW_PAYLOAD_FIELD"
    )

    /*
     * Non-member has Communications platform
     * permission but may not observe A ↔ B.
     */
    const nonMemberRecords =
      await loadCommunicationRealtimeSignalsWithClient({
        client,

        principal:
          principalC,

        since,
      })

    assert(
      !nonMemberRecords.some(
        (record) =>
          record.signal.conversationId ===
          conversation.id
      ),
      "REALTIME_NON_MEMBER_SIGNAL_LEAK"
    )

    /*
     * Open-stream semantics:
     * membership is re-evaluated every poll.
     *
     * Revoke B's active membership and query
     * again using the same Principal.
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

    const afterRevocation =
      await loadCommunicationRealtimeSignalsWithClient({
        client,

        principal:
          principalB,

        since,
      })

    assert(
      !afterRevocation.some(
        (record) =>
          record.signal.conversationId ===
          conversation.id
      ),
      "REALTIME_REVOKED_MEMBER_STILL_RECEIVES_SIGNAL"
    )

    /*
     * Platform permission remains an independent
     * authority boundary.
     */
    const principalWithoutAccess: Principal = {
      userId:
        userC.id,

      email:
        userC.email,

      roles:
        [],

      permissions:
        [],
    }

    let permissionBlocked =
      false

    try {
      await loadCommunicationRealtimeSignalsWithClient({
        client,

        principal:
          principalWithoutAccess,

        since,
      })
    } catch (error: unknown) {
      permissionBlocked =
        error instanceof Error &&
        error.message ===
          "MISSING_PERMISSION:COMMUNICATIONS_ACCESS"
    }

    assert(
      permissionBlocked,
      "REALTIME_PERMISSION_BOUNDARY_NOT_ENFORCED"
    )

    console.log(
      "✓ Communications realtime privacy smoke passed"
    )

    console.log({
      memberReceivesSignal:
        true,

      nonMemberSignalHidden:
        true,

      messageBodyExcluded:
        true,

      metadataExcluded:
        true,

      rawPayloadExcluded:
        true,

      revokedMembershipEnforced:
        true,

      permissionBoundaryEnforced:
        true,
    })
  } finally {
    if (
      conversationId
    ) {
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
    (error) => {
      console.error(
        error
      )

      process.exitCode =
        1
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    }
  )
