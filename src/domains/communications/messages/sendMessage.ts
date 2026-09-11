import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { sendMessageWithClient } from "./sendMessageWithClient"
import type {
  CommunicationSendableMessageKind,
} from "./messageVocabulary"

export async function sendMessage({
  principal,
  conversationId,
  clientMessageId,
  kind = "TEXT",
  body,
}: {
  principal: Principal
  conversationId: string
  clientMessageId: string
  kind?: CommunicationSendableMessageKind
  body: string
}) {
  return sendMessageWithClient({
    client: prisma,
    principal,
    conversationId,
    clientMessageId,
    kind,
    body,
  })
}
