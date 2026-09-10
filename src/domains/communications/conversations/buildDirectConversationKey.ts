export function buildDirectConversationKey(
  userIdA: string,
  userIdB: string
): string {
  const a = userIdA.trim()
  const b = userIdB.trim()

  if (!a || !b) {
    throw new Error("DIRECT_CONVERSATION_USER_REQUIRED")
  }

  if (a === b) {
    throw new Error("DIRECT_CONVERSATION_SELF_NOT_ALLOWED")
  }

  return [a, b].sort().join(":")
}
