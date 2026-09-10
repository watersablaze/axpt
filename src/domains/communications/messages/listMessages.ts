import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { listMessagesWithClient } from "./listMessagesWithClient"

export async function listMessages({
  principal,
  conversationId,
  cursor,
  limit,
}: {
  principal: Principal
  conversationId: string
  cursor?: string
  limit?: number
}) {
  return listMessagesWithClient({
    client: prisma,
    principal,
    conversationId,
    cursor,
    limit,
  })
}
