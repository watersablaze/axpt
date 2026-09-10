import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { listConversationsWithClient } from "./listConversationsWithClient"

export async function listConversations({
  principal,
}: {
  principal: Principal
}) {
  return listConversationsWithClient({
    client: prisma,
    principal,
  })
}
