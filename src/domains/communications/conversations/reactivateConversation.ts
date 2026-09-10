import { prisma } from "@/infrastructure/db/prisma"

import type { Principal } from "@/domains/auth/types"

import { reactivateConversationWithClient } from "./reactivateConversationWithClient"

export function reactivateConversation({
  principal,
  conversationId,
}: {
  principal: Principal
  conversationId: string
}) {
  return reactivateConversationWithClient({
    client:
      prisma,
    principal,
    conversationId,
  })
}
