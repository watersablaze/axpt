import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import {
  isCommunicationSendableMessageKind,
  type CommunicationSendableMessageKind,
} from "./messageVocabulary"

import {
  communicationMessageMatchesWorkflowReference,
  normalizeCommunicationMessageWorkflowReference,
  type CommunicationMessageWorkflowReferenceInput,
} from "./messageWorkflowReference"

import { sendMessageInTransaction } from "./sendMessageInTransaction"

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
  workflowReference,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  conversationId: string
  clientMessageId: string
  kind?: CommunicationSendableMessageKind
  body: string
  workflowReference?:
    | CommunicationMessageWorkflowReferenceInput
    | null
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

  const normalizedWorkflowReference =
    normalizeCommunicationMessageWorkflowReference(
      workflowReference
    )

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
      ) =>
        sendMessageInTransaction({
          tx,
          senderUserId:
            principal.userId,
          conversationId,
          clientMessageId:
            normalizedClientMessageId,
          kind:
            normalizedKind,
          body:
            normalizedBody,
          workflowReference:
            normalizedWorkflowReference,
        })
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
      existing.kind !== normalizedKind ||
      !communicationMessageMatchesWorkflowReference({
        message:
          existing,

        workflowReference:
          normalizedWorkflowReference,
      })
    ) {
      throw new Error(
        "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
      )
    }

    return existing
  }
}
