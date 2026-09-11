import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { archiveConversationWithClient } from "../../src/domains/communications/conversations/archiveConversationWithClient"
import { createDirectConversationWithClient } from "../../src/domains/communications/conversations/createDirectConversationWithClient"
import { sendMessageWithClient } from "../../src/domains/communications/messages/sendMessageWithClient"
import { linkOperationalRoomTargetWithClient } from "../../src/domains/communications/operational-links/linkOperationalRoomTargetWithClient"
import { createOperationalRoomWithClient } from "../../src/domains/communications/operational-rooms/createOperationalRoomWithClient"

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

function asRecord(
  value: unknown
): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      "EXPECTED_OBJECT"
    )
  }

  return value as Record<string, unknown>
}

async function main() {
  const nonce =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`

  const client =
    prisma as unknown as CommunicationsDatabaseClient

  const createdUserIds: string[] = []
  const createdCaseIds: string[] = []

  let operationalConversationId:
    | string
    | null =
    null

  let operationalRoomId:
    | string
    | null =
    null

  let directConversationId:
    | string
    | null =
    null

  try {
    /*
     * Operational Room member eligibility is
     * grounded in a real active role granting
     * COMMUNICATIONS_ACCESS.
     */
    const communicationsRole =
      await prisma.role.findFirst({
        where: {
          rolePermissions: {
            some: {
              permission: {
                key:
                  PERMISSIONS.COMMUNICATIONS_ACCESS,
              },
            },
          },
        },

        select: {
          id:
            true,
        },
      })

    assert(
      communicationsRole !== null,
      "COMMUNICATIONS_ACCESS_ROLE_NOT_FOUND"
    )

    const owner =
      await prisma.user.create({
        data: {
          username:
            `workflow-reference-owner-${nonce}`,

          email:
            `workflow-reference-owner-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          viewedDocs:
            [],
        },
      })

    const member =
      await prisma.user.create({
        data: {
          username:
            `workflow-reference-member-${nonce}`,

          email:
            `workflow-reference-member-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          viewedDocs:
            [],
        },
      })

    createdUserIds.push(
      owner.id,
      member.id
    )

    await prisma.userRole.create({
      data: {
        userId:
          member.id,

        roleId:
          communicationsRole.id,

        isActive:
          true,
      },
    })

    const ownerPrincipal: Principal = {
      userId:
        owner.id,

      email:
        owner.email,

      roles: [
        "ADMIN_PLATFORM",
      ],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_DIRECT_CREATE,
        PERMISSIONS.COMMUNICATIONS_GROUP_CREATE,
        PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND,
        PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE,
      ],
    }

    /*
     * Establish canonical operational context.
     */
    const createdRoom =
      await createOperationalRoomWithClient({
        client,

        principal:
          ownerPrincipal,

        clientRoomId:
          `workflow-reference-room-${nonce}`,

        title:
          `Workflow Reference Smoke ${nonce}`,

        roomClass:
          "CASE",

        memberUserIds: [
          member.id,
        ],
      })

    operationalConversationId =
      createdRoom.conversation.id

    operationalRoomId =
      createdRoom.room.id

    /*
     * Institutional fixtures:
     *
     * A = primary linked target
     * B = second linked target for collision proof
     * C = valid but intentionally unlinked
     * D = linked, then deleted to prove stale-target guard
     */
    const caseA =
      await prisma.case.create({
        data: {
          title:
            `Workflow Reference A ${nonce}`,
        },
      })

    const caseB =
      await prisma.case.create({
        data: {
          title:
            `Workflow Reference B ${nonce}`,
        },
      })

    const caseUnlinked =
      await prisma.case.create({
        data: {
          title:
            `Workflow Reference Unlinked ${nonce}`,
        },
      })

    const caseStale =
      await prisma.case.create({
        data: {
          title:
            `Workflow Reference Stale ${nonce}`,
        },
      })

    createdCaseIds.push(
      caseA.id,
      caseB.id,
      caseUnlinked.id,
      caseStale.id
    )

    const caseABefore =
      await prisma.case.findUniqueOrThrow({
        where: {
          id:
            caseA.id,
        },
      })

    await linkOperationalRoomTargetWithClient({
      client,

      principal:
        ownerPrincipal,

      roomId:
        createdRoom.room.id,

      targetType:
        "CASE",

      targetSubtype:
        "CASE",

      targetId:
        caseA.id,
    })

    await linkOperationalRoomTargetWithClient({
      client,

      principal:
        ownerPrincipal,

      roomId:
        createdRoom.room.id,

      targetType:
        "CASE",

      targetSubtype:
        "CASE",

      targetId:
        caseB.id,
    })

    await linkOperationalRoomTargetWithClient({
      client,

      principal:
        ownerPrincipal,

      roomId:
        createdRoom.room.id,

      targetType:
        "CASE",

      targetSubtype:
        "CASE",

      targetId:
        caseStale.id,
    })

    /*
     * A. Backward compatibility:
     * unreferenced messages remain valid.
     */
    const plainMessage =
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          createdRoom.conversation.id,

        clientMessageId:
          `workflow-plain-${nonce}`,

        body:
          `Unreferenced workflow smoke ${nonce}`,
      })

    assert(
      plainMessage.workflowTargetType ===
        null &&
      plainMessage.workflowTargetSubtype ===
        null &&
      plainMessage.workflowTargetId ===
        null,
      "WORKFLOW_REFERENCE_PLAIN_MESSAGE_NOT_NULL"
    )

    /*
     * B. Valid linked workflow reference.
     */
    const referencedBody =
      `Referenced CASE message ${nonce}`

    const referencedClientMessageId =
      `workflow-reference-${nonce}`

    const referencedMessage =
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          createdRoom.conversation.id,

        clientMessageId:
          referencedClientMessageId,

        kind:
          "APPROVAL_REQUEST",

        body:
          referencedBody,

        workflowReference: {
          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            caseA.id,
        },
      })

    assert(
      referencedMessage.workflowTargetType ===
        "CASE" &&
      referencedMessage.workflowTargetSubtype ===
        "CASE" &&
      referencedMessage.workflowTargetId ===
        caseA.id,
      "WORKFLOW_REFERENCE_NOT_PERSISTED"
    )

    const persistedReferencedMessage =
      await prisma.communicationMessage.findUniqueOrThrow({
        where: {
          id:
            referencedMessage.id,
        },
      })

    assert(
      persistedReferencedMessage.workflowTargetType ===
        "CASE" &&
      persistedReferencedMessage.workflowTargetSubtype ===
        "CASE" &&
      persistedReferencedMessage.workflowTargetId ===
        caseA.id,
      "WORKFLOW_REFERENCE_PERSISTENCE_MISMATCH"
    )

    /*
     * C. Event contract:
     * pointer metadata may be emitted;
     * message body may not.
     */
    const referencedEvent =
      await prisma.domainEvent.findFirst({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            createdRoom.conversation.id,

          eventType:
            "COMMUNICATION_MESSAGE_SENT",

          payload: {
            path: [
              "messageId",
            ],

            equals:
              referencedMessage.id,
          },
        },
      })

    assert(
      referencedEvent !== null,
      "WORKFLOW_REFERENCE_MESSAGE_EVENT_MISSING"
    )

    const eventPayload =
      asRecord(
        referencedEvent.payload
      )

    assert(
      !(
        "body" in
        eventPayload
      ),
      "WORKFLOW_REFERENCE_EVENT_EXPOSED_BODY"
    )

    const eventWorkflowReference =
      asRecord(
        eventPayload.workflowReference
      )

    assert(
      eventWorkflowReference.targetType ===
        "CASE" &&
      eventWorkflowReference.targetSubtype ===
        "CASE" &&
      eventWorkflowReference.targetId ===
        caseA.id,
      "WORKFLOW_REFERENCE_EVENT_POINTER_MISMATCH"
    )

    /*
     * D. Exact referenced retry is canonical.
     */
    const referencedRetry =
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          createdRoom.conversation.id,

        clientMessageId:
          referencedClientMessageId,

        kind:
          "APPROVAL_REQUEST",

        body:
          referencedBody,

        workflowReference: {
          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            caseA.id,
        },
      })

    assert(
      referencedRetry.id ===
        referencedMessage.id,
      "WORKFLOW_REFERENCE_RETRY_CREATED_DIFFERENT_MESSAGE"
    )

    const referencedMessageCount =
      await prisma.communicationMessage.count({
        where: {
          conversationId:
            createdRoom.conversation.id,

          senderUserId:
            owner.id,

          clientMessageId:
            referencedClientMessageId,
        },
      })

    assert(
      referencedMessageCount ===
        1,
      "WORKFLOW_REFERENCE_RETRY_PERSISTED_DUPLICATE"
    )

    const referencedEventCount =
      await prisma.domainEvent.count({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            createdRoom.conversation.id,

          eventType:
            "COMMUNICATION_MESSAGE_SENT",

          payload: {
            path: [
              "messageId",
            ],

            equals:
              referencedMessage.id,
          },
        },
      })

    assert(
      referencedEventCount ===
        1,
      "WORKFLOW_REFERENCE_RETRY_EMITTED_DUPLICATE_EVENT"
    )

    /*
     * E. Same submission identity with a different
     * linked workflow target is a collision.
     */
    let referenceCollisionBlocked =
      false

    try {
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          createdRoom.conversation.id,

        clientMessageId:
          referencedClientMessageId,

        kind:
          "APPROVAL_REQUEST",

        body:
          referencedBody,

        workflowReference: {
          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            caseB.id,
        },
      })
    } catch (error: unknown) {
      referenceCollisionBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
    }

    assert(
      referenceCollisionBlocked,
      "WORKFLOW_REFERENCE_IDEMPOTENCY_COLLISION_NOT_BLOCKED"
    )

    /*
     * F. DIRECT conversations may communicate,
     * but cannot carry C3 operational references.
     */
    const directConversation =
      await createDirectConversationWithClient({
        client,

        principal:
          ownerPrincipal,

        otherUserId:
          member.id,
      })

    directConversationId =
      directConversation.id

    const directPlainMessage =
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          directConversation.id,

        clientMessageId:
          `workflow-direct-plain-${nonce}`,

        body:
          `Direct plain message ${nonce}`,
      })

    assert(
      directPlainMessage.workflowTargetType ===
        null,
      "WORKFLOW_REFERENCE_DIRECT_PLAIN_MESSAGE_CHANGED"
    )

    let directReferenceBlocked =
      false

    try {
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          directConversation.id,

        clientMessageId:
          `workflow-direct-reference-${nonce}`,

        body:
          `Direct referenced message ${nonce}`,

        workflowReference: {
          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            caseA.id,
        },
      })
    } catch (error: unknown) {
      directReferenceBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_MESSAGE_WORKFLOW_REFERENCE_NOT_ALLOWED"
    }

    assert(
      directReferenceBlocked,
      "WORKFLOW_REFERENCE_DIRECT_CONVERSATION_NOT_BLOCKED"
    )

    /*
     * G. A globally valid target cannot be
     * introduced silently through a message.
     */
    let unlinkedTargetBlocked =
      false

    try {
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          createdRoom.conversation.id,

        clientMessageId:
          `workflow-unlinked-${nonce}`,

        body:
          `Unlinked target message ${nonce}`,

        workflowReference: {
          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            caseUnlinked.id,
        },
      })
    } catch (error: unknown) {
      unlinkedTargetBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_MESSAGE_WORKFLOW_TARGET_NOT_LINKED"
    }

    assert(
      unlinkedTargetBlocked,
      "WORKFLOW_REFERENCE_UNLINKED_TARGET_NOT_BLOCKED"
    )

    /*
     * H. Existing room context is insufficient if
     * the institutional target itself disappears.
     *
     * The polymorphic room link intentionally has
     * no FK into Case, so deleting the Case leaves
     * a stale pointer that the send command must
     * detect.
     */
    await prisma.case.delete({
      where: {
        id:
          caseStale.id,
      },
    })

    createdCaseIds.splice(
      createdCaseIds.indexOf(
        caseStale.id
      ),
      1
    )

    let staleTargetBlocked =
      false

    try {
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          createdRoom.conversation.id,

        clientMessageId:
          `workflow-stale-${nonce}`,

        body:
          `Stale target message ${nonce}`,

        workflowReference: {
          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            caseStale.id,
        },
      })
    } catch (error: unknown) {
      staleTargetBlocked =
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
    }

    assert(
      staleTargetBlocked,
      "WORKFLOW_REFERENCE_STALE_TARGET_NOT_BLOCKED"
    )

    /*
     * I. Referencing is non-mutating.
     */
    const caseAAfter =
      await prisma.case.findUniqueOrThrow({
        where: {
          id:
            caseA.id,
        },
      })

    assert(
      JSON.stringify(
        caseABefore
      ) ===
        JSON.stringify(
          caseAAfter
        ),
      "WORKFLOW_REFERENCE_MUTATED_CASE_TARGET"
    )

    /*
     * J. Archive preserves exact idempotent
     * recovery of an already durable referenced
     * message.
     */
    await archiveConversationWithClient({
      client,

      principal:
        ownerPrincipal,

      conversationId:
        createdRoom.conversation.id,
    })

    const archivedRetry =
      await sendMessageWithClient({
        client,

        principal:
          ownerPrincipal,

        conversationId:
          createdRoom.conversation.id,

        clientMessageId:
          referencedClientMessageId,

        kind:
          "APPROVAL_REQUEST",

        body:
          referencedBody,

        workflowReference: {
          targetType:
            "CASE",

          targetSubtype:
            "CASE",

          targetId:
            caseA.id,
        },
      })

    assert(
      archivedRetry.id ===
        referencedMessage.id,
      "WORKFLOW_REFERENCE_ARCHIVED_RETRY_NOT_PRESERVED"
    )

    console.log(
      "✓ Communication message workflow reference smoke test passed"
    )

    console.log({
      plainMessageCompatible:
        true,

      referencePersisted:
        true,

      eventReferencePreserved:
        true,

      eventBodyExcluded:
        true,

      exactRetryCanonical:
        true,

      duplicateEventPersisted:
        false,

      changedReferenceCollisionBlocked:
        true,

      directReferenceBlocked:
        true,

      unlinkedTargetBlocked:
        true,

      staleTargetBlocked:
        true,

      archivedExactRetryPreserved:
        true,

      institutionalTargetUnchanged:
        true,
    })
  } finally {
    const conversationIds = [
      operationalConversationId,
      directConversationId,
    ].filter(
      (
        value
      ): value is string =>
        value !== null
    )

    if (conversationIds.length > 0) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId: {
            in:
              conversationIds,
          },
        },
      })
    }

    if (operationalRoomId) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamType:
            "COMMUNICATION_OPERATIONAL_ROOM",

          streamId:
            operationalRoomId,
        },
      })
    }

    /*
     * Conversation cascade removes memberships,
     * messages, OperationalRoom and room links.
     */
    if (conversationIds.length > 0) {
      await prisma.communicationConversation.deleteMany({
        where: {
          id: {
            in:
              conversationIds,
          },
        },
      })
    }

    if (createdCaseIds.length > 0) {
      await prisma.case.deleteMany({
        where: {
          id: {
            in:
              createdCaseIds,
          },
        },
      })
    }

    if (createdUserIds.length > 0) {
      await prisma.wallet.deleteMany({
        where: {
          userId: {
            in:
              createdUserIds,
          },
        },
      })

      await prisma.userRole.deleteMany({
        where: {
          userId: {
            in:
              createdUserIds,
          },
        },
      })

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
      process.exitCode = 1
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    }
  )
