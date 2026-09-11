import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { createDirectConversationWithClient } from "../../src/domains/communications/conversations/createDirectConversationWithClient"
import { sendMessageWithClient } from "../../src/domains/communications/messages/sendMessageWithClient"
import {
  COMMUNICATION_SENDABLE_MESSAGE_KINDS,
  type CommunicationSendableMessageKind,
} from "../../src/domains/communications/messages/messageVocabulary"

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

  const createdUserIds: string[] = []
  let conversationId: string | null = null

  const client =
    prisma as unknown as CommunicationsDatabaseClient

  try {
    const userA =
      await prisma.user.create({
        data: {
          username:
            `communications-command-a-${nonce}`,
          email:
            `communications-command-a-${nonce}@axpt.local`,
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
            `communications-command-b-${nonce}`,
          email:
            `communications-command-b-${nonce}@axpt.local`,
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
            `communications-command-c-${nonce}`,
          email:
            `communications-command-c-${nonce}@axpt.local`,
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

    const communicationsPermissions = [
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
      permissions:
        communicationsPermissions,
    }

    const principalB: Principal = {
      userId:
        userB.id,
      email:
        userB.email,
      roles: [
        "ADMIN_PLATFORM",
      ],
      permissions:
        communicationsPermissions,
    }

    /*
     * C has send permission deliberately.
     * Membership—not platform permission—
     * must be what prevents access.
     */
    const principalC: Principal = {
      userId:
        userC.id,
      email:
        userC.email,
      roles: [],
      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
      ],
    }

    /*
     * Actual application command core.
     */
    const conversationA =
      await createDirectConversationWithClient({
        client,
        principal:
          principalA,
        otherUserId:
          userB.id,
      })

    conversationId =
      conversationA.id

    /*
     * Reverse initiation must resolve to
     * the same canonical conversation.
     */
    const conversationB =
      await createDirectConversationWithClient({
        client,
        principal:
          principalB,
        otherUserId:
          userA.id,
      })

    assert(
      conversationA.id ===
        conversationB.id,
      "DIRECT_COMMAND_NOT_CANONICAL"
    )

    assert(
      conversationA.members.length === 2,
      "DIRECT_COMMAND_MEMBER_COUNT_INVALID"
    )

    /*
     * Actual send-message application core.
     */
    const body =
      `command-smoke-${nonce}`

    const clientMessageId =
      `command-smoke-client-${nonce}`

    const message =
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversationA.id,
        clientMessageId:
          clientMessageId,
        body:
          body,
      })

    const persistedMessage =
      await prisma.communicationMessage.findUnique({
        where: {
          id:
            message.id,
        },
      })

    assert(
      persistedMessage !== null,
      "COMMAND_MESSAGE_NOT_DURABLE"
    )

    assert(
      persistedMessage.body === body,
      "COMMAND_MESSAGE_BODY_MISMATCH"
    )

    /*
     * Backward-compatible omission of kind
     * must remain canonical TEXT.
     */
    assert(
      persistedMessage.kind ===
        "TEXT",
      "DEFAULT_MESSAGE_KIND_NOT_TEXT"
    )

    /*
     * Exact retry must resolve to the
     * original durable message.
     */
    const retriedMessage =
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversationA.id,
        clientMessageId,
        body,
      })

    assert(
      retriedMessage.id === message.id,
      "MESSAGE_RETRY_CREATED_DIFFERENT_MESSAGE"
    )

    const idempotentMessageCount =
      await prisma.communicationMessage.count({
        where: {
          conversationId:
            conversationA.id,
          senderUserId:
            userA.id,
          clientMessageId,
        },
      })

    assert(
      idempotentMessageCount === 1,
      "MESSAGE_RETRY_PERSISTED_DUPLICATE"
    )

    /*
     * Reusing the same submission identity
     * for different content is a collision,
     * not a retry.
     */
    let collisionBlocked = false

    try {
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversationA.id,
        clientMessageId,
        body:
          `${body}-different`,
      })
    } catch (error: unknown) {
      collisionBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
    }

    assert(
      collisionBlocked,
      "MESSAGE_IDEMPOTENCY_COLLISION_NOT_BLOCKED"
    )

    /*
     * Event must exist but may not contain body.
     */
    const event =
      await prisma.domainEvent.findFirst({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            conversationA.id,

          eventType:
            "COMMUNICATION_MESSAGE_SENT",
        },

        orderBy: {
          createdAt:
            "desc",
        },
      })

    assert(
      event !== null,
      "COMMAND_MESSAGE_EVENT_NOT_FOUND"
    )

    const eventEnvelope =
      JSON.stringify({
        payload:
          event.payload,
        metadata:
          event.metadata,
      })

    assert(
      !eventEnvelope.includes(body),
      "COMMAND_MESSAGE_BODY_LEAKED_TO_EVENT"
    )

    const messageEventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",
          streamId:
            conversationA.id,
          eventType:
            "COMMUNICATION_MESSAGE_SENT",
        },
      })

    assert(
      messageEventCount === 1,
      "MESSAGE_RETRY_EMITTED_DUPLICATE_EVENT"
    )

    /*
     * C3.1A semantic message classification.
     *
     * Every human-sendable semantic kind must
     * survive the command boundary unchanged.
     */
    const semanticKinds =
      COMMUNICATION_SENDABLE_MESSAGE_KINDS.filter(
        (
          kind
        ): kind is Exclude<
          CommunicationSendableMessageKind,
          "TEXT"
        > =>
          kind !==
          "TEXT"
      )

    const semanticMessageIds: string[] = []

    for (
      const kind of
      semanticKinds
    ) {
      const semanticBody =
        `semantic-${kind}-${nonce}`

      const semanticClientMessageId =
        `semantic-${kind}-${nonce}`

      const semanticMessage =
        await sendMessageWithClient({
          client,
          principal:
            principalA,
          conversationId:
            conversationA.id,
          clientMessageId:
            semanticClientMessageId,
          kind,
          body:
            semanticBody,
        })

      semanticMessageIds.push(
        semanticMessage.id
      )

      assert(
        semanticMessage.kind ===
          kind,
        `SEMANTIC_MESSAGE_KIND_CHANGED:${kind}`
      )

      const persistedSemanticMessage =
        await prisma.communicationMessage.findUnique({
          where: {
            id:
              semanticMessage.id,
          },
        })

      assert(
        persistedSemanticMessage !==
          null,
        `SEMANTIC_MESSAGE_NOT_DURABLE:${kind}`
      )

      assert(
        persistedSemanticMessage.kind ===
          kind,
        `SEMANTIC_MESSAGE_KIND_NOT_DURABLE:${kind}`
      )

      /*
       * Same submission identity + same body +
       * same semantic kind is a canonical retry.
       */
      const semanticRetry =
        await sendMessageWithClient({
          client,
          principal:
            principalA,
          conversationId:
            conversationA.id,
          clientMessageId:
            semanticClientMessageId,
          kind,
          body:
            semanticBody,
        })

      assert(
        semanticRetry.id ===
          semanticMessage.id,
        `SEMANTIC_RETRY_CREATED_DIFFERENT_MESSAGE:${kind}`
      )

      /*
       * Same submission identity and body but a
       * different semantic classification is not
       * the same logical command.
       */
      const collisionKind:
        CommunicationSendableMessageKind =
          kind ===
          "NOTICE"
            ? "REQUEST"
            : "NOTICE"

      let semanticKindCollisionBlocked =
        false

      try {
        await sendMessageWithClient({
          client,
          principal:
            principalA,
          conversationId:
            conversationA.id,
          clientMessageId:
            semanticClientMessageId,
          kind:
            collisionKind,
          body:
            semanticBody,
        })
      } catch (error: unknown) {
        semanticKindCollisionBlocked =
          error instanceof Error &&
          error.message ===
            "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
      }

      assert(
        semanticKindCollisionBlocked,
        `SEMANTIC_KIND_IDEMPOTENCY_COLLISION_NOT_BLOCKED:${kind}`
      )

      /*
       * MESSAGE_SENT remains the canonical event.
       * Semantic classification belongs in its
       * payload; message body must remain private.
       */
      const semanticEvent =
        await prisma.domainEvent.findFirst({
          where: {
            streamType:
              "COMMUNICATION_CONVERSATION",

            streamId:
              conversationA.id,

            eventType:
              "COMMUNICATION_MESSAGE_SENT",

            payload: {
              path: [
                "messageId",
              ],
              equals:
                semanticMessage.id,
            },
          },
        })

      assert(
        semanticEvent !==
          null,
        `SEMANTIC_MESSAGE_EVENT_NOT_FOUND:${kind}`
      )

      const semanticEnvelope =
        JSON.stringify({
          payload:
            semanticEvent.payload,
          metadata:
            semanticEvent.metadata,
        })

      assert(
        semanticEnvelope.includes(
          `"kind":"${kind}"`
        ),
        `SEMANTIC_MESSAGE_EVENT_KIND_MISSING:${kind}`
      )

      assert(
        !semanticEnvelope.includes(
          semanticBody
        ),
        `SEMANTIC_MESSAGE_BODY_LEAKED_TO_EVENT:${kind}`
      )
    }

    /*
     * SYSTEM is schema vocabulary but not a
     * human-sendable semantic kind.
     *
     * Cast deliberately crosses the compile-time
     * boundary so this smoke proves the runtime
     * guard still exists.
     */
    let systemKindBlocked =
      false

    try {
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversationA.id,
        clientMessageId:
          `system-kind-${nonce}`,
        kind:
          "SYSTEM" as unknown as
            CommunicationSendableMessageKind,
        body:
          "SYSTEM MUST NOT BE HUMAN AUTHORED",
      })
    } catch (error: unknown) {
      systemKindBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_MESSAGE_KIND_INVALID"
    }

    assert(
      systemKindBlocked,
      "SYSTEM_MESSAGE_KIND_NOT_BLOCKED"
    )

    /*
     * Arbitrary runtime values must be rejected
     * independently of TypeScript.
     */
    let arbitraryKindBlocked =
      false

    try {
      await sendMessageWithClient({
        client,
        principal:
          principalA,
        conversationId:
          conversationA.id,
        clientMessageId:
          `arbitrary-kind-${nonce}`,
        kind:
          "EXECUTE_TREASURY" as unknown as
            CommunicationSendableMessageKind,
        body:
          "INVALID SEMANTIC KIND",
      })
    } catch (error: unknown) {
      arbitraryKindBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_MESSAGE_KIND_INVALID"
    }

    assert(
      arbitraryKindBlocked,
      "ARBITRARY_MESSAGE_KIND_NOT_BLOCKED"
    )

    /*
     * Invalid semantic kinds must never persist.
     */
    const invalidSemanticMessageCount =
      await prisma.communicationMessage.count({
        where: {
          conversationId:
            conversationA.id,
          clientMessageId: {
            in: [
              `system-kind-${nonce}`,
              `arbitrary-kind-${nonce}`,
            ],
          },
        },
      })

    assert(
      invalidSemanticMessageCount ===
        0,
      "INVALID_SEMANTIC_MESSAGE_PERSISTED"
    )

    /*
     * C has platform send permission,
     * but no conversation membership.
     */
    let nonMemberBlocked = false

    try {
      await sendMessageWithClient({
        client,
        principal:
          principalC,
        conversationId:
          conversationA.id,
        clientMessageId:
          `communications-smoke-smokeCommunicationsCommands-2-${nonce}`,
        body:
          "THIS MUST NOT PERSIST",
      })
    } catch (error: unknown) {
      nonMemberBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    }

    assert(
      nonMemberBlocked,
      "COMMAND_NON_MEMBER_NOT_BLOCKED"
    )

    const unauthorizedMessageCount =
      await prisma.communicationMessage.count({
        where: {
          conversationId:
            conversationA.id,

          senderUserId:
            userC.id,
        },
      })

    assert(
      unauthorizedMessageCount === 0,
      "UNAUTHORIZED_MESSAGE_PERSISTED"
    )

    /*
     * Platform authority also remains independent.
     */
    const principalWithoutCreate: Principal = {
      userId:
        userC.id,
      email:
        userC.email,
      roles: [],
      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
      ],
    }

    let missingPermissionBlocked = false

    try {
      await createDirectConversationWithClient({
        client,
        principal:
          principalWithoutCreate,
        otherUserId:
          userA.id,
      })
    } catch (error: unknown) {
      missingPermissionBlocked =
        error instanceof Error &&
        error.message ===
          "MISSING_PERMISSION:COMMUNICATIONS_DIRECT_CREATE"
    }

    assert(
      missingPermissionBlocked,
      "COMMAND_PERMISSION_BOUNDARY_NOT_ENFORCED"
    )

    console.log(
      "✓ Communications command smoke passed"
    )

    console.log({
      canonicalDirectConversation:
        true,

      conversationId:
        conversationA.id,

      memberCount:
        conversationA.members.length,

      messageDurable:
        true,

      idempotentRetryReturnsOriginal:
        true,

      duplicateMessagePrevented:
        true,

      idempotencyCollisionBlocked:
        true,

      duplicateEventPrevented:
        true,

      eventDurable:
        true,

      bodyExcludedFromEvent:
        true,

      defaultMessageKindText:
        true,

      semanticKindsPersisted:
        semanticKinds.length,

      semanticRetriesCanonical:
        true,

      semanticKindCollisionBlocked:
        true,

      semanticEventKindPreserved:
        true,

      semanticBodiesExcludedFromEvents:
        true,

      systemKindBlocked:
        true,

      arbitraryKindBlocked:
        true,

      invalidSemanticMessagesPersisted:
        false,

      nonMemberBlocked:
        true,

      unauthorizedMessagePersisted:
        false,

      permissionBoundaryEnforced:
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
