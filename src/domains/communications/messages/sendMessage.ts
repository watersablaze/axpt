import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { sendMessageWithClient } from "./sendMessageWithClient"
import type {
  CommunicationSendableMessageKind,
} from "./messageVocabulary"

import type {
  CommunicationMessageWorkflowReferenceInput,
} from "./messageWorkflowReference"

export async function sendMessage({
  principal,
  conversationId,
  clientMessageId,
  kind = "TEXT",
  body,
  workflowReference,
}: {
  principal: Principal
  conversationId: string
  clientMessageId: string
  kind?: CommunicationSendableMessageKind
  body: string
  workflowReference?:
    | CommunicationMessageWorkflowReferenceInput
    | null
}) {
  return sendMessageWithClient({
    client: prisma,
    principal,
    conversationId,
    clientMessageId,
    kind,
    body,
    workflowReference,
  })
}
