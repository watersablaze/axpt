import { COMMUNICATION_EVENT_TYPE } from "../events"

import { requireConversationWritable } from "../conversations/requireConversationWritable"

import {
  requireConversationMember,
  type CommunicationMemberClient,
} from "../membership/requireConversationMember"

import {
  requireCommunicationOperationalTargetExists,
} from "../operational/operationalTargetPointer"

import type {
  CommunicationsTransactionClient,
} from "../shared/databaseTypes"

import type {
  CommunicationSendableMessageKind,
} from "./messageVocabulary"

import {
  communicationMessageMatchesWorkflowReference,
  type CommunicationMessageWorkflowReference,
} from "./messageWorkflowReference"

export async function sendMessageInTransactionWithResult({
  tx,
  senderUserId,
  conversationId,
  clientMessageId,
  kind,
  body,
  workflowReference,
  eventMetadata,
}: {
  tx: CommunicationsTransactionClient
  senderUserId: string
  conversationId: string
  clientMessageId: string
  kind: CommunicationSendableMessageKind
  body: string
  workflowReference:
    | CommunicationMessageWorkflowReference
    | null
  eventMetadata?:
    | Readonly<Record<string, string>>
    | null
}) {
  await requireConversationMember(
    tx as unknown as CommunicationMemberClient,
    conversationId,
    senderUserId
  )

  const existing =
    await tx.communicationMessage.findUnique({
      where: {
        conversationId_senderUserId_clientMessageId: {
          conversationId,
          senderUserId,
          clientMessageId,
        },
      },
    })

  if (existing) {
    if (
      existing.body !== body ||
      existing.kind !== kind ||
      !communicationMessageMatchesWorkflowReference({
        message: existing,
        workflowReference,
      })
    ) {
      throw new Error(
        "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
      )
    }

    return {
      message: existing,
      created: false,
    } as const
  }

  await requireConversationWritable(
    tx,
    conversationId
  )

  if (workflowReference) {
    const operationalRoom =
      await tx.communicationOperationalRoom.findUnique({
        where: {
          conversationId,
        },
        select: {
          id: true,
        },
      })

    if (!operationalRoom) {
      throw new Error(
        "COMMUNICATION_MESSAGE_WORKFLOW_REFERENCE_NOT_ALLOWED"
      )
    }

    const roomLink =
      await tx.communicationOperationalLink.findUnique({
        where: {
          roomId_targetType_targetSubtype_targetId: {
            roomId:
              operationalRoom.id,
            targetType:
              workflowReference.targetType,
            targetSubtype:
              workflowReference.targetSubtype,
            targetId:
              workflowReference.targetId,
          },
        },
        select: {
          id: true,
        },
      })

    if (!roomLink) {
      throw new Error(
        "COMMUNICATION_MESSAGE_WORKFLOW_TARGET_NOT_LINKED"
      )
    }

    /*
     * A room link establishes communication scope,
     * but the referenced institutional object must
     * still exist at send time.
     *
     * Validation only. No target mutation.
     */
    await requireCommunicationOperationalTargetExists({
      tx,
      targetType:
        workflowReference.targetType,
      targetSubtype:
        workflowReference.targetSubtype,
      targetId:
        workflowReference.targetId,
    })
  }

  const message =
    await tx.communicationMessage.create({
      data: {
        conversationId,
        senderUserId,
        clientMessageId,
        kind,
        body,

        workflowTargetType:
          workflowReference?.targetType ??
          null,

        workflowTargetSubtype:
          workflowReference?.targetSubtype ??
          null,

        workflowTargetId:
          workflowReference?.targetId ??
          null,
      },
    })

  await tx.communicationConversation.update({
    where: {
      id: conversationId,
    },
    data: {
      updatedAt:
        message.createdAt,
    },
  })

  await tx.domainEvent.create({
    data: {
      streamType:
        "COMMUNICATION_CONVERSATION",

      streamId:
        conversationId,

      eventType:
        COMMUNICATION_EVENT_TYPE
          .MESSAGE_SENT,

      payload: {
        messageId:
          message.id,
        conversationId,
        senderUserId,
        kind:
          message.kind,

        workflowReference:
          message.workflowTargetType &&
          message.workflowTargetSubtype &&
          message.workflowTargetId
            ? {
                targetType:
                  message.workflowTargetType,
                targetSubtype:
                  message.workflowTargetSubtype,
                targetId:
                  message.workflowTargetId,
              }
            : null,

        createdAt:
          message.createdAt.toISOString(),
      },

      metadata: {
        ...(eventMetadata ?? {}),
        actorUserId:
          senderUserId,
      },

      occurredAt:
        message.createdAt,
    },
  })

  return {
    message,
    created: true,
  } as const
}

export async function sendMessageInTransaction(
  params: Parameters<
    typeof sendMessageInTransactionWithResult
  >[0]
) {
  const result =
    await sendMessageInTransactionWithResult(
      params
    )

  return result.message
}
