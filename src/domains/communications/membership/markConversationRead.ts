import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { markConversationReadWithClient } from "./markConversationReadWithClient"

export async function markConversationRead({
  principal,
  conversationId,
  throughMessageId,
}: {
  principal: Principal
  conversationId: string
  throughMessageId: string
}) {
  return markConversationReadWithClient({
    client: prisma,
    principal,
    conversationId,
    throughMessageId,
  })
}
