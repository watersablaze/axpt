import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { sendMessageWithClient } from "./sendMessageWithClient"

export async function sendMessage({
  principal,
  conversationId,
  clientMessageId,
  body,
}: {
  principal: Principal
  conversationId: string
  clientMessageId: string
  body: string
}) {
  return sendMessageWithClient({
    client: prisma,
    principal,
    conversationId,
    clientMessageId,
    body,
  })
}
