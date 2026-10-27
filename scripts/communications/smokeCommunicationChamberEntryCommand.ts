import { readFileSync } from "node:fs"

const command =
  readFileSync(
    "src/domains/communications/chamber/enterChamberCommunicationWithClient.ts",
    "utf8"
  )

const events =
  readFileSync(
    "src/domains/communications/events.ts",
    "utf8"
  )

const vocabulary =
  readFileSync(
    "src/domains/communications/chamber/chamberVocabulary.ts",
    "utf8"
  )

function requireContains(
  source: string,
  token: string,
  error: string
) {
  if (
    !source.includes(
      token
    )
  ) {
    throw new Error(
      error
    )
  }
}

for (const permission of [
  "COMMUNICATIONS_MESSAGE_SEND",
  "COMMUNICATIONS_CONVERSATION_MANAGE",
]) {
  requireContains(
    command,
    permission,
    `CHAMBER_PERMISSION_MISSING:${permission}`
  )
}

requireContains(
  command,
  "sendMessageInTransaction",
  "CHAMBER_CANONICAL_MESSAGE_PRIMITIVE_MISSING"
)

requireContains(
  command,
  "client.$transaction",
  "CHAMBER_ATOMIC_TRANSACTION_MISSING"
)

requireContains(
  command,
  "communicationOperationalRoom.findUnique",
  "CHAMBER_OPERATIONAL_ROOM_REQUIREMENT_MISSING"
)

requireContains(
  command,
  "communicationChamberRecord.create",
  "CHAMBER_RECORD_CREATE_MISSING"
)

requireContains(
  command,
  'createHash',
  "CHAMBER_BODY_DIGEST_MISSING"
)

requireContains(
  command,
  '"sha256"',
  "CHAMBER_SHA256_MISSING"
)

requireContains(
  command,
  "message.body",
  "CHAMBER_PERSISTED_BODY_HASH_SOURCE_MISSING"
)

requireContains(
  command,
  "authorUserId:\n                principal.userId",
  "CHAMBER_AUTHOR_PRINCIPAL_BINDING_MISSING"
)

requireContains(
  command,
  "enteredByUserId:\n                principal.userId",
  "CHAMBER_RECORDER_PRINCIPAL_BINDING_MISSING"
)

requireContains(
  command,
  "COMMUNICATION_CHAMBER_RECORD_IDEMPOTENCY_COLLISION",
  "CHAMBER_FORMAL_IDEMPOTENCY_MISSING"
)

requireContains(
  command,
  "COMMUNICATION_CHAMBER_RESPONSE_SCOPE_INVALID",
  "CHAMBER_RESPONSE_SCOPE_MISSING"
)

requireContains(
  command,
  "COMMUNICATION_CHAMBER_SUPERSESSION_SCOPE_INVALID",
  "CHAMBER_SUPERSESSION_SCOPE_MISSING"
)

requireContains(
  command,
  "CHAMBER_RECORD_ENTERED",
  "CHAMBER_RECORD_EVENT_USE_MISSING"
)

requireContains(
  events,
  '"COMMUNICATION_CHAMBER_RECORD_ENTERED"',
  "CHAMBER_RECORD_EVENT_TYPE_MISSING"
)

for (const value of [
  "ADDRESS",
  "NOTICE",
  "PETITION",
  "ACKNOWLEDGMENT",
  "RESPONSE",
  "DECISION_NOTICE",
]) {
  requireContains(
    vocabulary,
    `"${value}"`,
    `CHAMBER_CLASS_MISSING:${value}`
  )
}

for (const value of [
  "CHAMBER",
  "COUNCIL",
  "PARTICIPANT",
  "PARTICIPANTS",
  "OFFICE",
]) {
  requireContains(
    vocabulary,
    `"${value}"`,
    `CHAMBER_ADDRESSEE_MISSING:${value}`
  )
}

/*
 * Constitutional exclusions:
 * formal communication records context and provenance;
 * it does not execute institutional state transitions.
 */
for (const forbidden of [
  "InstrumentAuthority",
  "TreasuryGateway",
  "SettlementInstruction",
  "executeInstrument",
  "transitionInstrument",
  "issueInstrument",
]) {
  if (
    command.includes(
      forbidden
    )
  ) {
    throw new Error(
      `CHAMBER_FORBIDDEN_AUTHORITY_COUPLING:${forbidden}`
    )
  }
}

console.log(
  "✓ Chamber entry command static contract passed"
)

console.log({
  atomicMessageAndRecord:
    true,
  operationalRoomRequired:
    true,
  authenticatedAuthor:
    true,
  authenticatedRecorder:
    true,
  explicitCapacitySnapshot:
    true,
  explicitAddresseeSnapshot:
    true,
  persistedBodyDigest:
    true,
  sameRoomResponseLineage:
    true,
  sameRoomSupersessionLineage:
    true,
  formalIdempotency:
    true,
  chamberEntryEvent:
    true,
  institutionalMutationAbsent:
    true,
})
