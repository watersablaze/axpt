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
            `communications-archive-rt-a-${nonce}`,
          email:
            `communications-archive-rt-a-${nonce}@axpt.local`,
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
            `communications-archive-rt-b-${nonce}`,
          email:
            `communications-archive-rt-b-${nonce}@axpt.local`,
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

    const since =
      new Date(
        Date.now() - 60_000
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

    await sendMessageWithClient({
      client,
      principal:
        principalA,
      conversationId:
        conversation.id,
      clientMessageId:
        `archive-rt-${nonce}`,
      body:
        `archive realtime ${nonce}`,
    })

    /*
     * ACTIVE conversation participates in
     * realtime delivery.
     */
    const activeRecords =
      await loadCommunicationRealtimeSignalsWithClient({
        client,
        principal:
          principalB,
        since,
      })

    assert(
      activeRecords.some(
        (record) =>
          record.signal.conversationId ===
            conversation.id &&
          record.signal.type ===
            "COMMUNICATION_MESSAGE_SENT"
      ),
      "ACTIVE_CONVERSATION_REALTIME_SIGNAL_MISSING"
    )

    /*
     * Archive without changing membership.
     */
    await prisma.communicationConversation.update({
      where: {
        id:
          conversation.id,
      },

      data: {
        status:
          "ARCHIVED",
        archivedAt:
          new Date(),
      },
    })

    /*
     * Use the SAME historical cursor.
     *
     * If status is not enforced at realtime
     * membership discovery, the old message event
     * would still appear here.
     */
    const archivedRecords =
      await loadCommunicationRealtimeSignalsWithClient({
        client,
        principal:
          principalB,
        since,
      })

    assert(
      !archivedRecords.some(
        (record) =>
          record.signal.conversationId ===
            conversation.id
      ),
      "ARCHIVED_CONVERSATION_REALTIME_SIGNAL_VISIBLE"
    )

    /*
     * Membership itself must remain active.
     */
    const membership =
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
      membership !== null,
      "ARCHIVE_MUTATED_REALTIME_MEMBER_AUTHORITY"
    )

    console.log(
      "✓ Communications archive realtime smoke passed"
    )

    console.log({
      activeRealtimeVisible:
        true,
      archivedRealtimeHidden:
        true,
      historicalSignalSuppressedAfterArchive:
        true,
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
