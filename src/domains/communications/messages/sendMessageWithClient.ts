import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import { COMMUNICATION_EVENT_TYPE } from "../events"

import { requireConversationWritable } from "../conversations/requireConversationWritable"

import {
  isCommunicationSendableMessageKind,
  type CommunicationSendableMessageKind,
} from "./messageVocabulary"

import {
  requireConversationMember,
  type CommunicationMemberClient,
} from "../membership/requireConversationMember"

import type {
  CommunicationsDatabaseClient,
  CommunicationsTransactionClient,
} from "../shared/databaseTypes"

const MAX_MESSAGE_LENGTH = 10_000
const MAX_CLIENT_MESSAGE_ID_LENGTH = 200

function isUniqueConstraintError(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  )
}

export async function sendMessageWithClient({
  client,
  principal,
  conversationId,
  clientMessageId,
  kind = "TEXT",
  body,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  conversationId: string
  clientMessageId: string
  kind?: CommunicationSendableMessageKind
  body: string
}) {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND
  )

  if (
    !isCommunicationSendableMessageKind(
      kind
    )
  ) {
    throw new Error(
      "COMMUNICATION_MESSAGE_KIND_INVALID"
    )
  }

  const normalizedKind =
    kind

  const normalizedBody =
    body.trim()

  const normalizedClientMessageId =
    clientMessageId.trim()

  if (!normalizedBody) {
    throw new Error(
      "COMMUNICATION_MESSAGE_BODY_REQUIRED"
    )
  }

  if (
    normalizedBody.length >
    MAX_MESSAGE_LENGTH
  ) {
    throw new Error(
      "COMMUNICATION_MESSAGE_BODY_TOO_LONG"
    )
  }

  if (!normalizedClientMessageId) {
    throw new Error(
      "COMMUNICATION_CLIENT_MESSAGE_ID_REQUIRED"
    )
  }

  if (
    normalizedClientMessageId.length >
    MAX_CLIENT_MESSAGE_ID_LENGTH
  ) {
    throw new Error(
      "COMMUNICATION_CLIENT_MESSAGE_ID_INVALID"
    )
  }

  try {
    return await client.$transaction(
      async (
        tx: CommunicationsTransactionClient
      ) => {
        await requireConversationMember(
          tx as unknown as CommunicationMemberClient,
          conversationId,
          principal.userId
        )

        const existing =
          await tx.communicationMessage.findUnique({
            where: {
              conversationId_senderUserId_clientMessageId: {
                conversationId,
                senderUserId:
                  principal.userId,
                clientMessageId:
                  normalizedClientMessageId,
              },
            },
          })

        if (existing) {
          if (
            existing.body !== normalizedBody ||
            existing.kind !== normalizedKind
          ) {
            throw new Error(
              "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
            )
          }

          return existing
        }

        await requireConversationWritable(
          tx,
          conversationId
        )

        const message =
          await tx.communicationMessage.create({
            data: {
              conversationId,
              senderUserId:
                principal.userId,
              clientMessageId:
                normalizedClientMessageId,
              kind:
                normalizedKind,
              body:
                normalizedBody,
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
              senderUserId:
                principal.userId,
              kind:
                message.kind,
              createdAt:
                message.createdAt.toISOString(),
            },

            metadata: {
              actorUserId:
                principal.userId,
            },

            occurredAt:
              message.createdAt,
          },
        })

        return message
      }
    )
  } catch (error) {
    /*
     * Concurrent duplicate submissions may both
     * pass the initial lookup. The database unique
     * constraint arbitrates the race.
     */
    if (!isUniqueConstraintError(error)) {
      throw error
    }

    const existing =
      await client.communicationMessage.findUnique({
        where: {
          conversationId_senderUserId_clientMessageId: {
            conversationId,
            senderUserId:
              principal.userId,
            clientMessageId:
              normalizedClientMessageId,
          },
        },
      })

    if (!existing) {
      throw error
    }

    if (
      existing.body !== normalizedBody ||
      existing.kind !== normalizedKind
    ) {
      throw new Error(
        "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
      )
    }

    return existing
  }
}
