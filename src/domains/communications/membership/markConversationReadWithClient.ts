import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes"

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

  const membership =
    await client.communicationMember.findFirst({
      where: {
        conversationId,
        userId: principal.userId,
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
        userId: principal.userId,
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
