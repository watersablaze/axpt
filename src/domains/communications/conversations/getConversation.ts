import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { getConversationWithClient } from "./getConversationWithClient"

export async function getConversation({
  principal,
  conversationId,
}: {
  principal: Principal
  conversationId: string
}) {
  return getConversationWithClient({
    client: prisma,
    principal,
    conversationId,
  })
}
