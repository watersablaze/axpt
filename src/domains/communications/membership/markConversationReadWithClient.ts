import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes"

export async function markConversationReadForMemberWithClient({
  client,
  userId,
  conversationId,
  throughMessageId,
}: {
  client: CommunicationsDatabaseClient
  userId: string
  conversationId: string
  throughMessageId: string
}) {
  const membership =
    await client.communicationMember.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
    })

  if (!membership) {
    throw new Error(
      "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    )
  }

  const message =
    await client.communicationMessage.findFirst({
      where: {
        id: throughMessageId,
        conversationId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

  if (!message) {
    throw new Error(
      "COMMUNICATION_READ_MESSAGE_NOT_FOUND"
    )
  }

  if (membership.lastReadMessageId) {
    const previous =
      await client.communicationMessage.findUnique({
        where: {
          id: membership.lastReadMessageId,
        },
        select: {
          createdAt: true,
        },
      })

    if (
      previous &&
      previous.createdAt > message.createdAt
    ) {
      throw new Error(
        "COMMUNICATION_READ_STATE_REGRESSION_NOT_ALLOWED"
      )
    }
  }

  return client.communicationMember.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },

    data: {
      lastReadMessageId:
        message.id,
      lastReadAt:
        new Date(),
    },
  })
}

export async function markConversationReadWithClient({
  client,
  principal,
  conversationId,
  throughMessageId,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  conversationId: string
  throughMessageId: string
}) {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_ACCESS
  )

  return markConversationReadForMemberWithClient({
    client,
    userId: principal.userId,
    conversationId,
    throughMessageId,
  })
}
