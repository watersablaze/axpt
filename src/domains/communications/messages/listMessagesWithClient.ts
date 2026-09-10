import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes"
import {
  requireConversationMember,
  type CommunicationMemberClient,
} from "../membership/requireConversationMember"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function listMessagesWithClient({
  client,
  principal,
  conversationId,
  cursor,
  limit = DEFAULT_LIMIT,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  conversationId: string
  cursor?: string
  limit?: number
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

  const take =
    Math.max(
      1,
      Math.min(limit, MAX_LIMIT)
    )

  return client.communicationMessage.findMany({
    where: {
      conversationId,
    },

    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],

    take,

    ...(cursor
      ? {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }
      : {}),
  })
}
