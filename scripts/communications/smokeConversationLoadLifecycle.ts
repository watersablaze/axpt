import { isCurrentConversationLoad } from "../../src/domains/communications/client/isCurrentConversationLoad"

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  /*
   * A starts first.
   */
  const generationA = 1

  /*
   * Operator selects B before A completes.
   * Selection change advances generation.
   */
  const generationB = 2

  const selectedConversationId =
    "conversation-b"

  const currentGeneration =
    generationB

  const staleAAllowed =
    isCurrentConversationLoad({
      requestedConversationId:
        "conversation-a",
      selectedConversationId,
      generation:
        generationA,
      currentGeneration,
    })

  assert(
    staleAAllowed === false,
    "STALE_CONVERSATION_A_LOAD_ACCEPTED"
  )

  const currentBAllowed =
    isCurrentConversationLoad({
      requestedConversationId:
        "conversation-b",
      selectedConversationId,
      generation:
        generationB,
      currentGeneration,
    })

  assert(
    currentBAllowed === true,
    "CURRENT_CONVERSATION_B_LOAD_REJECTED"
  )

  /*
   * Same conversation, obsolete generation.
   * Realtime or manual refresh may start a newer
   * request for B before an older B request returns.
   */
  const obsoleteBAllowed =
    isCurrentConversationLoad({
      requestedConversationId:
        "conversation-b",
      selectedConversationId,
      generation:
        generationA,
      currentGeneration:
        generationB,
    })

  assert(
    obsoleteBAllowed === false,
    "OBSOLETE_SAME_CONVERSATION_LOAD_ACCEPTED"
  )

  /*
   * Selection cleared by authority revocation.
   * No in-flight load may commit afterward.
   */
  const revokedAllowed =
    isCurrentConversationLoad({
      requestedConversationId:
        "conversation-b",
      selectedConversationId:
        null,
      generation:
        generationB,
      currentGeneration:
        generationB + 1,
    })

  assert(
    revokedAllowed === false,
    "REVOKED_CONVERSATION_LOAD_ACCEPTED"
  )

  console.log(
    "✓ Communications conversation lifecycle smoke passed"
  )

  console.log({
    stalePriorConversationBlocked:
      true,
    currentConversationAccepted:
      true,
    obsoleteSameConversationLoadBlocked:
      true,
    revokedSelectionLoadBlocked:
      true,
  })
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
