import type { Principal } from "@/domains/auth/types"

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes"

import { transitionConversationStatusWithClient } from "./transitionConversationStatusWithClient"

export function archiveConversationWithClient({
  client,
  principal,
  conversationId,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  conversationId: string
}) {
  return transitionConversationStatusWithClient({
    client,
    principal,
    conversationId,
    fromStatus:
      "ACTIVE",
    toStatus:
      "ARCHIVED",
  })
}
