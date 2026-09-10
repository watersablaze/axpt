import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes"
import {
  requireConversationMember,
  type CommunicationMemberClient,
} from "../membership/requireConversationMember"

export async function getConversationWithClient({
  client,
  principal,
  conversationId,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  conversationId: string
}) {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_ACCESS
  )

  await requireConversationMember(
    client as unknown as CommunicationMemberClient,
    conversationId,
    principal.userId
  )

  const conversation =
    await client.communicationConversation.findUnique({
      where: {
        id: conversationId,
      },

      include: {
        members: {
          where: {
            leftAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                name: true,
              },
            },
          },
        },
      },
    })

  if (!conversation) {
    throw new Error(
      "COMMUNICATION_CONVERSATION_NOT_FOUND"
    )
  }

  return conversation
}
