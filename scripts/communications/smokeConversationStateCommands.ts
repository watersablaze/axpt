import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { archiveConversationWithClient } from "../../src/domains/communications/conversations/archiveConversationWithClient"
import { createDirectConversationWithClient } from "../../src/domains/communications/conversations/createDirectConversationWithClient"
import { reactivateConversationWithClient } from "../../src/domains/communications/conversations/reactivateConversationWithClient"

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

  let conversationId:
    string | null = null

  try {
    const userA =
      await prisma.user.create({
        data: {
          username:
            `communications-state-a-${nonce}`,

          email:
            `communications-state-a-${nonce}@axpt.local`,

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
            `communications-state-b-${nonce}`,

          email:
            `communications-state-b-${nonce}@axpt.local`,

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
            `communications-state-c-${nonce}`,

          email:
            `communications-state-c-${nonce}@axpt.local`,

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
     * A is an authorized room-state governor
     * and an active member.
     */
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
        PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE,
      ],
    }

    /*
     * B is an active member but lacks room-state
     * governance authority.
     */
    const principalB: Principal = {
      userId:
        userB.id,

      email:
        userB.email,

      roles: [
        "COMMUNICATIONS_OPERATOR",
      ],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
      ],
    }

    /*
     * C holds MANAGE authority but is not a
     * member of A ↔ B.
     */
    const principalC: Principal = {
      userId:
        userC.id,

      email:
        userC.email,

      roles: [
        "ADMIN_PLATFORM",
      ],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE,
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
     * ───────────────────────────────────────
     * PERMISSION BOUNDARY
     * Member without MANAGE cannot archive.
     * ───────────────────────────────────────
     */
    let permissionBlocked =
      false

    try {
      await archiveConversationWithClient({
        client,

        principal:
          principalB,

        conversationId:
          conversation.id,
      })
    } catch (error: unknown) {
      permissionBlocked =
        error instanceof Error &&
        error.message ===
          "MISSING_PERMISSION:COMMUNICATIONS_CONVERSATION_MANAGE"
    }

    assert(
      permissionBlocked,
      "CONVERSATION_MANAGE_PERMISSION_NOT_ENFORCED"
    )

    /*
     * ───────────────────────────────────────
     * MEMBERSHIP BOUNDARY
     * MANAGE alone cannot govern a foreign room.
     * ───────────────────────────────────────
     */
    let nonMemberBlocked =
      false

    try {
      await archiveConversationWithClient({
        client,

        principal:
          principalC,

        conversationId:
          conversation.id,
      })
    } catch (error: unknown) {
      nonMemberBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    }

    assert(
      nonMemberBlocked,
      "CONVERSATION_MANAGE_MEMBERSHIP_NOT_ENFORCED"
    )

    const beforeAuthorizedTransition =
      await prisma.communicationConversation.findUniqueOrThrow({
        where: {
          id:
            conversation.id,
        },
      })

    assert(
      beforeAuthorizedTransition.status ===
        "ACTIVE",
      "DENIED_ARCHIVE_MUTATED_CONVERSATION"
    )

    /*
     * ───────────────────────────────────────
     * CONCURRENT ARCHIVE
     * Both requests should converge on the
     * same durable target state.
     * ───────────────────────────────────────
     */
    const archiveResults =
      await Promise.allSettled([
        archiveConversationWithClient({
          client,

          principal:
            principalA,

          conversationId:
            conversation.id,
        }),

        archiveConversationWithClient({
          client,

          principal:
            principalA,

          conversationId:
            conversation.id,
        }),
      ])

    assert(
      archiveResults.every(
        result =>
          result.status ===
          "fulfilled"
      ),
      "CONCURRENT_ARCHIVE_DID_NOT_CONVERGE"
    )

    const archived =
      await prisma.communicationConversation.findUniqueOrThrow({
        where: {
          id:
            conversation.id,
        },
      })

    assert(
      archived.status ===
        "ARCHIVED",
      "CONCURRENT_ARCHIVE_TARGET_STATE_MISSING"
    )

    assert(
      archived.archivedAt !==
        null,
      "ARCHIVE_TIMESTAMP_NOT_SET"
    )

    const archiveEventCountAfterConcurrency =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            conversation.id,

          eventType:
            "COMMUNICATION_CONVERSATION_ARCHIVED",
        },
      })

    assert(
      archiveEventCountAfterConcurrency ===
        1,
      "CONCURRENT_ARCHIVE_DUPLICATED_EVENT"
    )

    /*
     * Target-state retry must remain a no-op.
     */
    const archiveRetry =
      await archiveConversationWithClient({
        client,

        principal:
          principalA,

        conversationId:
          conversation.id,
      })

    assert(
      archiveRetry.status ===
        "ARCHIVED",
      "ARCHIVE_RETRY_TARGET_STATE_BROKEN"
    )

    const archiveEventCountAfterRetry =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            conversation.id,

          eventType:
            "COMMUNICATION_CONVERSATION_ARCHIVED",
        },
      })

    assert(
      archiveEventCountAfterRetry ===
        1,
      "ARCHIVE_RETRY_DUPLICATED_EVENT"
    )

    /*
     * ───────────────────────────────────────
     * CONCURRENT REACTIVATION
     * Same convergence rule in reverse.
     * ───────────────────────────────────────
     */
    const reactivateResults =
      await Promise.allSettled([
        reactivateConversationWithClient({
          client,

          principal:
            principalA,

          conversationId:
            conversation.id,
        }),

        reactivateConversationWithClient({
          client,

          principal:
            principalA,

          conversationId:
            conversation.id,
        }),
      ])

    assert(
      reactivateResults.every(
        result =>
          result.status ===
          "fulfilled"
      ),
      "CONCURRENT_REACTIVATION_DID_NOT_CONVERGE"
    )

    const reactivated =
      await prisma.communicationConversation.findUniqueOrThrow({
        where: {
          id:
            conversation.id,
        },
      })

    assert(
      reactivated.status ===
        "ACTIVE",
      "CONCURRENT_REACTIVATION_TARGET_STATE_MISSING"
    )

    assert(
      reactivated.archivedAt ===
        null,
      "REACTIVATION_ARCHIVE_TIMESTAMP_NOT_CLEARED"
    )

    const reactivateEventCountAfterConcurrency =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            conversation.id,

          eventType:
            "COMMUNICATION_CONVERSATION_REACTIVATED",
        },
      })

    assert(
      reactivateEventCountAfterConcurrency ===
        1,
      "CONCURRENT_REACTIVATION_DUPLICATED_EVENT"
    )

    /*
     * Target-state retry again must emit nothing.
     */
    const reactivateRetry =
      await reactivateConversationWithClient({
        client,

        principal:
          principalA,

        conversationId:
          conversation.id,
      })

    assert(
      reactivateRetry.status ===
        "ACTIVE",
      "REACTIVATION_RETRY_TARGET_STATE_BROKEN"
    )

    const reactivateEventCountAfterRetry =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            conversation.id,

          eventType:
            "COMMUNICATION_CONVERSATION_REACTIVATED",
        },
      })

    assert(
      reactivateEventCountAfterRetry ===
        1,
      "REACTIVATION_RETRY_DUPLICATED_EVENT"
    )

    console.log(
      "✓ Communications conversation state command smoke passed"
    )

    console.log({
      permissionBoundaryEnforced:
        true,

      membershipBoundaryEnforced:
        true,

      deniedTransitionDidNotMutate:
        true,

      concurrentArchiveConverged:
        true,

      archiveTimestampSet:
        true,

      archiveEventExactlyOnce:
        true,

      archiveRetryIdempotent:
        true,

      concurrentReactivateConverged:
        true,

      archivedAtCleared:
        true,

      reactivateEventExactlyOnce:
        true,

      reactivateRetryIdempotent:
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
