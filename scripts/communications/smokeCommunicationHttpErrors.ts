import { communicationHttpError } from "../../src/domains/communications/http/communicationHttpError"

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function readError(
  response: Response
) {
  const body =
    await response.json() as {
      ok?: unknown
      error?: unknown
    }

  return {
    status:
      response.status,
    ok:
      body.ok,
    error:
      body.error,
  }
}

async function main() {
  const missingPermission =
    await readError(
      communicationHttpError(
        new Error(
          "MISSING_PERMISSION:COMMUNICATIONS_CONVERSATION_MANAGE"
        )
      )
    )

  assert(
    missingPermission.status ===
      403,
    "HTTP_MISSING_PERMISSION_STATUS_INVALID"
  )

  assert(
    missingPermission.error ===
      "MISSING_PERMISSION:COMMUNICATIONS_CONVERSATION_MANAGE",
    "HTTP_MISSING_PERMISSION_BODY_INVALID"
  )

  const accessDenied =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
        )
      )
    )

  assert(
    accessDenied.status ===
      403,
    "HTTP_ACCESS_DENIED_STATUS_INVALID"
  )

  const notFound =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_CONVERSATION_NOT_FOUND"
        )
      )
    )

  assert(
    notFound.status ===
      404,
    "HTTP_NOT_FOUND_STATUS_INVALID"
  )

  const archived =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_CONVERSATION_ARCHIVED"
        )
      )
    )

  assert(
    archived.status ===
      409,
    "HTTP_ARCHIVED_STATUS_INVALID"
  )

  const transitionInvalid =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_CONVERSATION_TRANSITION_INVALID"
        )
      )
    )

  assert(
    transitionInvalid.status ===
      409,
    "HTTP_TRANSITION_INVALID_STATUS_INVALID"
  )

  const transitionConflict =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_CONVERSATION_TRANSITION_CONFLICT"
        )
      )
    )

  assert(
    transitionConflict.status ===
      409,
    "HTTP_TRANSITION_CONFLICT_STATUS_INVALID"
  )

  const badRequest =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_READ_STATE_REGRESSION_NOT_ALLOWED"
        )
      )
    )

  assert(
    badRequest.status ===
      400,
    "HTTP_BAD_REQUEST_STATUS_INVALID"
  )

  /*
   * C2 operational-room HTTP contract.
   */
  const operationalCollision =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_OPERATIONAL_ROOM_IDEMPOTENCY_COLLISION"
        )
      )
    )

  assert(
    operationalCollision.status ===
      409,
    "HTTP_OPERATIONAL_ROOM_COLLISION_STATUS_INVALID"
  )

  assert(
    operationalCollision.error ===
      "COMMUNICATION_OPERATIONAL_ROOM_IDEMPOTENCY_COLLISION",
    "HTTP_OPERATIONAL_ROOM_COLLISION_BODY_INVALID"
  )

  const clientRoomIdInvalid =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_CLIENT_ROOM_ID_INVALID"
        )
      )
    )

  assert(
    clientRoomIdInvalid.status ===
      400,
    "HTTP_CLIENT_ROOM_ID_INVALID_STATUS_INVALID"
  )

  const roomClassInvalid =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_OPERATIONAL_ROOM_CLASS_INVALID"
        )
      )
    )

  assert(
    roomClassInvalid.status ===
      400,
    "HTTP_OPERATIONAL_ROOM_CLASS_INVALID_STATUS_INVALID"
  )

  const roomTitleInvalid =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_OPERATIONAL_ROOM_TITLE_INVALID"
        )
      )
    )

  assert(
    roomTitleInvalid.status ===
      400,
    "HTTP_OPERATIONAL_ROOM_TITLE_INVALID_STATUS_INVALID"
  )

  const roomMemberInvalid =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_OPERATIONAL_ROOM_MEMBER_INVALID"
        )
      )
    )

  assert(
    roomMemberInvalid.status ===
      400,
    "HTTP_OPERATIONAL_ROOM_MEMBER_INVALID_STATUS_INVALID"
  )

  const roomMemberIneligible =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_OPERATIONAL_ROOM_MEMBER_INELIGIBLE:user-123"
        )
      )
    )

  assert(
    roomMemberIneligible.status ===
      400,
    "HTTP_OPERATIONAL_ROOM_MEMBER_INELIGIBLE_STATUS_INVALID"
  )

  assert(
    roomMemberIneligible.error ===
      "COMMUNICATION_OPERATIONAL_ROOM_MEMBER_INELIGIBLE:user-123",
    "HTTP_OPERATIONAL_ROOM_MEMBER_INELIGIBLE_BODY_INVALID"
  )

  /*
   * C2 operational-target link contract.
   */
  const operationalRoomNotFound =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_OPERATIONAL_ROOM_NOT_FOUND"
        )
      )
    )

  assert(
    operationalRoomNotFound.status ===
      404,
    "HTTP_OPERATIONAL_ROOM_NOT_FOUND_STATUS_INVALID"
  )

  const operationalTargetNotFound =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
        )
      )
    )

  assert(
    operationalTargetNotFound.status ===
      404,
    "HTTP_OPERATIONAL_TARGET_NOT_FOUND_STATUS_INVALID"
  )

  const operationalTopologyInvalid =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_OPERATIONAL_ROOM_TOPOLOGY_INVALID"
        )
      )
    )

  assert(
    operationalTopologyInvalid.status ===
      409,
    "HTTP_OPERATIONAL_TOPOLOGY_STATUS_INVALID"
  )

  const targetValidationErrors = [
    "COMMUNICATION_OPERATIONAL_ROOM_ID_REQUIRED",
    "COMMUNICATION_OPERATIONAL_TARGET_TYPE_INVALID",
    "COMMUNICATION_OPERATIONAL_TARGET_ID_REQUIRED",
    "COMMUNICATION_OPERATIONAL_TARGET_SUBTYPE_REQUIRED",
    "COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPE_INVALID",
    "COMMUNICATION_OPERATIONAL_TARGET_SUBTYPE_MISMATCH",
  ]

  for (
    const errorCode of
    targetValidationErrors
  ) {
    const response =
      await readError(
        communicationHttpError(
          new Error(
            errorCode
          )
        )
      )

    assert(
      response.status ===
        400,
      `HTTP_OPERATIONAL_TARGET_VALIDATION_STATUS_INVALID:${errorCode}`
    )

    assert(
      response.error ===
        errorCode,
      `HTTP_OPERATIONAL_TARGET_VALIDATION_BODY_INVALID:${errorCode}`
    )
  }

  const directoryPurposeInvalid =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_DIRECTORY_PURPOSE_INVALID"
        )
      )
    )

  assert(
    directoryPurposeInvalid.status ===
      400,
    "HTTP_DIRECTORY_PURPOSE_INVALID_STATUS_INVALID"
  )

  /*
   * C3.1A semantic message contract.
   */
  const messageKindInvalid =
    await readError(
      communicationHttpError(
        new Error(
          "COMMUNICATION_MESSAGE_KIND_INVALID"
        )
      )
    )

  assert(
    messageKindInvalid.status ===
      400,
    "HTTP_MESSAGE_KIND_INVALID_STATUS_INVALID"
  )

  assert(
    messageKindInvalid.error ===
      "COMMUNICATION_MESSAGE_KIND_INVALID",
    "HTTP_MESSAGE_KIND_INVALID_BODY_INVALID"
  )

  /*
   * Avoid exercising the unknown/internal-error
   * branches here because those intentionally log
   * through console.error.
   */

  console.log(
    "✓ Communications HTTP error contract smoke passed"
  )

  console.log({
    missingPermission403:
      true,
    membershipDenied403:
      true,
    conversationNotFound404:
      true,
    archivedConflict409:
      true,
    invalidTransition409:
      true,
    transitionConflict409:
      true,
    badRequest400:
      true,

    operationalRoomCollision409:
      true,

    clientRoomIdInvalid400:
      true,

    operationalRoomClassInvalid400:
      true,

    operationalRoomTitleInvalid400:
      true,

    operationalRoomMemberInvalid400:
      true,

    operationalRoomMemberIneligible400:
      true,

    operationalRoomNotFound404:
      true,

    operationalTargetNotFound404:
      true,

    operationalRoomTopologyConflict409:
      true,

    operationalTargetValidation400:
      true,

    directoryPurposeInvalid400:
      true,

    messageKindInvalid400:
      true,
  })
}

main().catch(
  error => {
    console.error(error)

    process.exitCode =
      1
  }
)
