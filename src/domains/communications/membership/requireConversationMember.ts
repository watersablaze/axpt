export type CommunicationMemberClient = {
  communicationMember: {
    findFirst(args: {
      where: {
        conversationId: string
        userId: string
        leftAt: null
      }
    }): Promise<unknown>
  }
}

export async function requireConversationMember(
  client: CommunicationMemberClient,
  conversationId: string,
  userId: string
) {
  const membership =
    await client.communicationMember.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
    })

  if (!membership) {
    throw new Error(
      "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    )
  }

  return membership
}
