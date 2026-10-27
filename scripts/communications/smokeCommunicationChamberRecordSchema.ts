import { readFileSync } from "node:fs"

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const source =
  readFileSync(
    "prisma/schema.prisma",
    "utf8"
  )

const modelStart =
  source.indexOf(
    "model CommunicationChamberRecord {"
  )

const modelEnd =
  source.indexOf(
    "enum CommunicationOperationalRoomClass {",
    modelStart
  )

assert(
  modelStart !== -1 &&
    modelEnd !== -1,
  "CHAMBER_RECORD_MODEL_RANGE_MISSING"
)

const model =
  source.slice(
    modelStart,
    modelEnd
  )

assert(
  source.includes(
    "enum CommunicationChamberClass"
  ) &&
    source.includes("ADDRESS") &&
    source.includes("PETITION") &&
    source.includes("ACKNOWLEDGMENT") &&
    source.includes("DECISION_NOTICE"),
  "CHAMBER_CLASS_VOCABULARY_MISSING"
)

assert(
  source.includes(
    "enum CommunicationChamberAddresseeType"
  ) &&
    source.includes("CHAMBER") &&
    source.includes("COUNCIL") &&
    source.includes("PARTICIPANT") &&
    source.includes("PARTICIPANTS") &&
    source.includes("OFFICE"),
  "CHAMBER_ADDRESSEE_VOCABULARY_MISSING"
)

assert(
  model.includes(
    "messageId"
  ) &&
    model.includes(
      "String @unique"
    ),
  "CHAMBER_MESSAGE_ONE_TO_ZERO_OR_ONE_MISSING"
)

assert(
  model.includes(
    "conversationId"
  ) &&
    model.includes(
      "operationalRoomId"
    ),
  "CHAMBER_SITUATED_RECORD_FIELDS_MISSING"
)

assert(
  model.includes(
    "authorUserId"
  ) &&
    model.includes(
      "enteredByUserId"
    ),
  "CHAMBER_HUMAN_PROVENANCE_MISSING"
)

assert(
  model.includes(
    "authorCapacityKey"
  ) &&
    model.includes(
      "authorCapacityLabel"
    ),
  "CHAMBER_CAPACITY_SNAPSHOT_MISSING"
)

assert(
  model.includes(
    "addresseeType"
  ) &&
    model.includes(
      "addresseeSnapshot"
    ),
  "CHAMBER_ADDRESSEE_SNAPSHOT_MISSING"
)

assert(
  model.includes(
    "bodyHash"
  ),
  "CHAMBER_BODY_HASH_MISSING"
)

assert(
  model.includes(
    "respondsToRecordId"
  ) &&
    model.includes(
      "supersedesRecordId"
    ),
  "CHAMBER_APPEND_ONLY_RELATIONSHIPS_MISSING"
)

assert(
  model.includes(
    "onDelete: Restrict"
  ),
  "CHAMBER_DELETION_PROTECTION_MISSING"
)

assert(
  !model.includes(
    "chamberId"
  ),
  "UNIVERSAL_CHAMBER_AGGREGATE_PREMATURELY_INVENTED"
)

assert(
  !model.includes(
    "InstrumentAuthority"
  ) &&
    !model.includes(
      "authorityId"
    ),
  "INSTRUMENT_AUTHORITY_MISUSED_FOR_CHAMBER_CAPACITY"
)

const targetStart =
  source.indexOf(
    "enum CommunicationOperationalTargetType {"
  )

const targetEnd =
  source.indexOf(
    "model CommunicationOperationalRoom {",
    targetStart
  )

assert(
  targetStart !== -1 &&
    targetEnd !== -1,
  "OPERATIONAL_TARGET_RANGE_MISSING"
)

const targetEnum =
  source.slice(
    targetStart,
    targetEnd
  )

assert(
  !targetEnum.includes(
    "INSTITUTIONAL_INSTRUMENT"
  ),
  "INSTITUTIONAL_INSTRUMENT_TARGET_PREMATURELY_ADDED"
)

console.log({
  formalRecordModelPresent: true,
  chamberVocabularyPresent: true,
  operationalRoomRequired: true,
  authorRecorderSeparated: true,
  capacitySnapshotPresent: true,
  audienceSnapshotPresent: true,
  bodyDigestPresent: true,
  appendOnlyRecordRelationsPresent: true,
  deletionProtectionPresent: true,
  universalChamberNotInvented: true,
  instrumentAuthorityNotMisused: true,
  instrumentTargetDeferred: true,
})
