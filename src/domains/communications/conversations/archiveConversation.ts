import { prisma } from "@/infrastructure/db/prisma"

import type { Principal } from "@/domains/auth/types"

import { archiveConversationWithClient } from "./archiveConversationWithClient"

export function archiveConversation({
  principal,
  conversationId,
}: {
  principal: Principal
  conversationId: string
}) {
  return archiveConversationWithClient({
    client:
      prisma,
    principal,
    conversationId,
  })
}
