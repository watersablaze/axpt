import type { CommunicationsTransactionClient } from "../shared/databaseTypes"

export async function requireConversationWritable(
  client: CommunicationsTransactionClient,
  conversationId: string
) {
  const conversation =
    await client.communicationConversation.findUnique({
      where: {
        id: conversationId,
      },

      select: {
        id: true,
        status: true,
      },
    })

  if (!conversation) {
    throw new Error(
      "COMMUNICATION_CONVERSATION_NOT_FOUND"
    )
  }

  if (
    conversation.status !== "ACTIVE"
  ) {
    throw new Error(
      "COMMUNICATION_CONVERSATION_ARCHIVED"
    )
  }

  return conversation
}
