import { toPublicCommunicationConversation } from "../../src/domains/communications/http/toPublicCommunicationConversation"

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function main() {
  const createdAt =
    new Date("2026-09-10T20:00:00.000Z")

  const updatedAt =
    new Date("2026-09-10T20:05:00.000Z")

  const linkedAt =
    new Date("2026-09-10T20:03:00.000Z")

  const source = {
    id:
      "conversation-public-projection",

    kind:
      "GROUP",

    status:
      "ACTIVE",

    title:
      "Treasury Operations",

    members:
      [],

    messages:
      [],

    unreadCount:
      0,

    operationalRoom: {
      id:
        "room-public-projection",

      conversationId:
        "conversation-public-projection",

      clientRoomId:
        "SECRET_CLIENT_ROOM_ID",

      requestFingerprint:
        "SECRET_REQUEST_FINGERPRINT",

      roomClass:
        "TREASURY",

      createdByUserId:
        "user-owner",

      createdAt,
      updatedAt,

      links: [
        {
          id:
            "link-public-projection",

          roomId:
            "room-public-projection",

          targetType:
            "TREASURY_GATEWAY_AGGREGATE",

          targetSubtype:
            "TREASURY_INSTRUCTION",

          targetId:
            "treasury-instruction-001",

          linkedByUserId:
            "user-owner",

          linkedAt,
        },
      ],
    },
  }

  const projected =
    toPublicCommunicationConversation(
      source
    )

  assert(
    projected.id ===
      source.id,
    "PUBLIC_PROJECTION_CONVERSATION_ID_LOST"
  )

  assert(
    projected.operationalRoom !==
      null,
    "PUBLIC_PROJECTION_OPERATIONAL_ROOM_LOST"
  )

  assert(
    projected.operationalRoom.id ===
      source.operationalRoom.id,
    "PUBLIC_PROJECTION_ROOM_ID_LOST"
  )

  assert(
    projected.operationalRoom.roomClass ===
      "TREASURY",
    "PUBLIC_PROJECTION_ROOM_CLASS_LOST"
  )

  assert(
    projected.operationalRoom.links.length ===
      1,
    "PUBLIC_PROJECTION_LINK_LOST"
  )

  const link =
    projected.operationalRoom.links[0]

  assert(
    link.targetType ===
      "TREASURY_GATEWAY_AGGREGATE",
    "PUBLIC_PROJECTION_TARGET_TYPE_LOST"
  )

  assert(
    link.targetSubtype ===
      "TREASURY_INSTRUCTION",
    "PUBLIC_PROJECTION_TARGET_SUBTYPE_LOST"
  )

  assert(
    link.targetId ===
      "treasury-instruction-001",
    "PUBLIC_PROJECTION_TARGET_ID_LOST"
  )

  /*
   * Command/idempotency infrastructure must
   * never cross the public HTTP boundary.
   */
  assert(
    !(
      "clientRoomId" in
      projected.operationalRoom
    ),
    "PUBLIC_PROJECTION_LEAKED_CLIENT_ROOM_ID"
  )

  assert(
    !(
      "requestFingerprint" in
      projected.operationalRoom
    ),
    "PUBLIC_PROJECTION_LEAKED_REQUEST_FINGERPRINT"
  )

  /*
   * Persistence-parent identifiers are redundant
   * once nested in the public representation.
   */
  assert(
    !(
      "conversationId" in
      projected.operationalRoom
    ),
    "PUBLIC_PROJECTION_LEAKED_ROOM_CONVERSATION_ID"
  )

  assert(
    !(
      "roomId" in
      link
    ),
    "PUBLIC_PROJECTION_LEAKED_LINK_ROOM_ID"
  )

  /*
   * A normal DIRECT conversation must retain an
   * explicit null operationalRoom.
   */
  const directProjected =
    toPublicCommunicationConversation({
      id:
        "conversation-direct",

      kind:
        "DIRECT",

      status:
        "ACTIVE",

      operationalRoom:
        null,
    })

  assert(
    directProjected.operationalRoom ===
      null,
    "PUBLIC_PROJECTION_DIRECT_ROOM_NOT_NULL"
  )

  /*
   * JSON serialization should remain clean,
   * because this projection feeds Response.json.
   */
  const serialized =
    JSON.stringify(
      projected
    )

  assert(
    !serialized.includes(
      "SECRET_CLIENT_ROOM_ID"
    ),
    "PUBLIC_PROJECTION_SERIALIZED_CLIENT_ROOM_ID"
  )

  assert(
    !serialized.includes(
      "SECRET_REQUEST_FINGERPRINT"
    ),
    "PUBLIC_PROJECTION_SERIALIZED_REQUEST_FINGERPRINT"
  )

  console.log(
    "✓ Communications public projection smoke test passed"
  )

  console.log({
    operationalRoomPreserved:
      true,

    operationalLinksPreserved:
      true,

    clientRoomIdExposed:
      false,

    requestFingerprintExposed:
      false,

    redundantParentIdsExposed:
      false,

    directConversationNullPreserved:
      true,

    serializedSecretsExposed:
      false,
  })
}

main()
