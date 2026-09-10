export function isCurrentConversationLoad({
  requestedConversationId,
  selectedConversationId,
  generation,
  currentGeneration,
}: {
  requestedConversationId: string
  selectedConversationId: string | null
  generation: number
  currentGeneration: number
}) {
  return (
    requestedConversationId ===
      selectedConversationId &&
    generation ===
      currentGeneration
  )
}
