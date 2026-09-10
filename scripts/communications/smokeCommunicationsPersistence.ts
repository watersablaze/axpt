import { PrismaClient } from "@prisma/client"

import { buildDirectConversationKey } from "../../src/domains/communications/conversations/buildDirectConversationKey"
import {
  requireConversationMember,
  type CommunicationMemberClient,
} from "../../src/domains/communications/membership/requireConversationMember"

const prisma = new PrismaClient()

type TransactionClient = Omit<
  typeof prisma,
  "$connect" |
  "$disconnect" |
  "$on" |
  "$transaction" |
  "$use" |
  "$extends"
>

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function isUniqueConstraintError(
  error: unknown
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
}

async function main() {
  const nonce = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`

  const messageBody =
    `communications-smoke-secret-${nonce}`

  const rollbackBody =
    `communications-smoke-rollback-${nonce}`

  const createdUserIds: string[] = []
  let conversationId: string | null = null

  try {
    /*
     * Create three isolated smoke users:
     * A + B are conversation members.
     * C must remain outside the conversation.
     */
    const userA = await prisma.user.create({
      data: {
        username: `communications-smoke-a-${nonce}`,
        email: `communications-smoke-a-${nonce}@axpt.local`,
        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",
        viewedDocs: [],
      },
    })

    const userB = await prisma.user.create({
      data: {
        username: `communications-smoke-b-${nonce}`,
        email: `communications-smoke-b-${nonce}@axpt.local`,
        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",
        viewedDocs: [],
      },
    })

    const userC = await prisma.user.create({
      data: {
        username: `communications-smoke-c-${nonce}`,
        email: `communications-smoke-c-${nonce}@axpt.local`,
        passwordHash: "COMMUNICATIONS_SMOKE_ONLY",
        viewedDocs: [],
      },
    })

    createdUserIds.push(
      userA.id,
      userB.id,
      userC.id
    )

    /*
     * Canonical direct-key symmetry.
     */
    const directKeyAB =
      buildDirectConversationKey(
        userA.id,
        userB.id
      )

    const directKeyBA =
      buildDirectConversationKey(
        userB.id,
        userA.id
      )

    assert(
      directKeyAB === directKeyBA,
      "DIRECT_KEY_NOT_SYMMETRIC"
    )

    /*
     * Persist conversation + creation event atomically.
     */
    const conversation =
      await prisma.$transaction(async (tx: TransactionClient) => {
        const created =
          await tx.communicationConversation.create({
            data: {
              kind: "DIRECT",
              status: "ACTIVE",
              directKey: directKeyAB,
              createdByUserId: userA.id,

              members: {
                create: [
                  {
                    userId: userA.id,
                    role: "MEMBER",
                  },
                  {
                    userId: userB.id,
                    role: "MEMBER",
                  },
                ],
              },
            },
            include: {
              members: true,
            },
          })

        await tx.domainEvent.create({
          data: {
            streamType:
              "COMMUNICATION_CONVERSATION",
            streamId: created.id,
            eventType:
              "COMMUNICATION_CONVERSATION_CREATED",
            payload: {
              conversationId: created.id,
              kind: "DIRECT",
            },
            metadata: {
              actorUserId: userA.id,
              smoke: true,
            },
          },
        })

        return created
      })

    conversationId = conversation.id

    assert(
      conversation.members.length === 2,
      "DIRECT_CONVERSATION_MEMBER_COUNT_INVALID"
    )

    /*
     * Database-level canonical uniqueness.
     */
    let duplicateRejected = false

    try {
      await prisma.communicationConversation.create({
        data: {
          kind: "DIRECT",
          status: "ACTIVE",
          directKey: directKeyBA,
          createdByUserId: userB.id,
        },
      })
    } catch (error: unknown) {
      duplicateRejected =
        isUniqueConstraintError(error)

      if (!duplicateRejected) {
        throw error
      }
    }

    assert(
      duplicateRejected,
      "DUPLICATE_DIRECT_CONVERSATION_NOT_REJECTED"
    )

    /*
     * Membership authorization primitive.
     */
    const memberClient =
      prisma as unknown as CommunicationMemberClient

    await requireConversationMember(
      memberClient,
      conversation.id,
      userA.id
    )

    let nonMemberRejected = false

    try {
      await requireConversationMember(
        memberClient,
        conversation.id,
        userC.id
      )
    } catch (error: unknown) {
      nonMemberRejected =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    }

    assert(
      nonMemberRejected,
      "NON_MEMBER_ACCESS_NOT_REJECTED"
    )

    /*
     * Persist Message + DomainEvent in one transaction.
     */
    const message =
      await prisma.$transaction(async (tx: TransactionClient) => {
        const created =
          await tx.communicationMessage.create({
            data: {
              conversationId:
                conversation.id,
              senderUserId:
                userA.id,
              kind:
                "TEXT",
              body:
                messageBody,
            },
          })

        await tx.domainEvent.create({
          data: {
            streamType:
              "COMMUNICATION_CONVERSATION",
            streamId:
              conversation.id,
            eventType:
              "COMMUNICATION_MESSAGE_SENT",

            payload: {
              messageId:
                created.id,
              conversationId:
                conversation.id,
              senderUserId:
                userA.id,
              kind:
                created.kind,
              createdAt:
                created.createdAt.toISOString(),
            },

            metadata: {
              actorUserId:
                userA.id,
              smoke:
                true,
            },

            occurredAt:
              created.createdAt,
          },
        })

        return created
      })

    /*
     * Durable message proof.
     */
    const persistedMessage =
      await prisma.communicationMessage.findUnique({
        where: {
          id: message.id,
        },
      })

    assert(
      persistedMessage !== null,
      "MESSAGE_NOT_DURABLE"
    )

    assert(
      persistedMessage.body === messageBody,
      "MESSAGE_BODY_CHANGED"
    )

    /*
     * Durable event proof.
     */
    const messageEvent =
      await prisma.domainEvent.findFirst({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",
          streamId:
            conversation.id,
          eventType:
            "COMMUNICATION_MESSAGE_SENT",
        },
        orderBy: {
          createdAt: "desc",
        },
      })

    assert(
      messageEvent !== null,
      "MESSAGE_EVENT_NOT_DURABLE"
    )

    /*
     * Privacy boundary:
     * the communication body must not enter
     * the generic DomainEvent payload or metadata.
     */
    const eventEnvelope = JSON.stringify({
      payload:
        messageEvent.payload,
      metadata:
        messageEvent.metadata,
    })

    assert(
      !eventEnvelope.includes(messageBody),
      "MESSAGE_BODY_LEAKED_INTO_DOMAIN_EVENT"
    )

    /*
     * Atomic rollback proof.
     *
     * Create a message and event, then deliberately fail
     * before commit. Neither record may survive.
     */
    let rollbackTriggered = false

    try {
      await prisma.$transaction(async (tx: TransactionClient) => {
        const rolledBackMessage =
          await tx.communicationMessage.create({
            data: {
              conversationId:
                conversation.id,
              senderUserId:
                userA.id,
              kind:
                "TEXT",
              body:
                rollbackBody,
            },
          })

        await tx.domainEvent.create({
          data: {
            streamType:
              "COMMUNICATION_CONVERSATION",
            streamId:
              conversation.id,
            eventType:
              "COMMUNICATION_MESSAGE_SENT",
            payload: {
              messageId:
                rolledBackMessage.id,
              conversationId:
                conversation.id,
            },
            metadata: {
              smoke:
                true,
              rollbackProbe:
                true,
            },
          },
        })

        throw new Error(
          "EXPECTED_COMMUNICATION_ROLLBACK"
        )
      })
    } catch (error: unknown) {
      rollbackTriggered =
        error instanceof Error &&
        error.message ===
          "EXPECTED_COMMUNICATION_ROLLBACK"
    }

    assert(
      rollbackTriggered,
      "ROLLBACK_PROBE_DID_NOT_TRIGGER"
    )

    const rolledBackMessageCount =
      await prisma.communicationMessage.count({
        where: {
          conversationId:
            conversation.id,
          body:
            rollbackBody,
        },
      })

    assert(
      rolledBackMessageCount === 0,
      "MESSAGE_SURVIVED_FAILED_TRANSACTION"
    )

    const rolledBackEventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",
          streamId:
            conversation.id,
          metadata: {
            path: ["rollbackProbe"],
            equals: true,
          },
        },
      })

    assert(
      rolledBackEventCount === 0,
      "EVENT_SURVIVED_FAILED_TRANSACTION"
    )

    console.log(
      "✓ Communications persistence smoke passed"
    )

    console.log({
      conversationId:
        conversation.id,

      directKeyCanonical:
        directKeyAB === directKeyBA,

      memberCount:
        conversation.members.length,

      duplicateDirectRejected:
        duplicateRejected,

      nonMemberRejected,

      messageDurable:
        true,

      messageEventDurable:
        true,

      bodyExcludedFromDomainEvent:
        true,

      atomicRollbackVerified:
        true,
    })
  } finally {
    /*
     * Smoke cleanup.
     * DomainEvent has no FK to Conversation,
     * so remove its stream explicitly.
     */
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
