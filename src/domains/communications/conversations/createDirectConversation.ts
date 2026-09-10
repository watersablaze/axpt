import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { createDirectConversationWithClient } from "./createDirectConversationWithClient"

export async function createDirectConversation({
  principal,
  otherUserId,
}: {
  principal: Principal
  otherUserId: string
}) {
  return createDirectConversationWithClient({
    client: prisma,
    principal,
    otherUserId,
  })
}
