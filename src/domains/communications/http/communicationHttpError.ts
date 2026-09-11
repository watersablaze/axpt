export function communicationHttpError(
  error: unknown
) {
  if (!(error instanceof Error)) {
    return Response.json(
      {
        ok: false,
        error:
          "COMMUNICATIONS_UNKNOWN_ERROR",
      },
      {
        status: 500,
      }
    )
  }

  if (
    error.message.startsWith(
      "MISSING_PERMISSION:"
    )
  ) {
    return Response.json(
      {
        ok: false,
        error:
          error.message,
      },
      {
        status: 403,
      }
    )
  }

  if (
    error.message ===
      "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
  ) {
    return Response.json(
      {
        ok: false,
        error:
          error.message,
      },
      {
        status: 403,
      }
    )
  }

  if (
    error.message ===
      "COMMUNICATION_CONVERSATION_NOT_FOUND" ||
    error.message ===
      "COMMUNICATION_READ_MESSAGE_NOT_FOUND" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_ROOM_NOT_FOUND" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
  ) {
    return Response.json(
      {
        ok: false,
        error:
          error.message,
      },
      {
        status: 404,
      }
    )
  }

  if (
    error.message ===
      "COMMUNICATION_CONVERSATION_ARCHIVED" ||
    error.message ===
      "COMMUNICATION_CONVERSATION_TRANSITION_INVALID" ||
    error.message ===
      "COMMUNICATION_CONVERSATION_TRANSITION_CONFLICT" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_ROOM_IDEMPOTENCY_COLLISION" ||
    error.message ===
      "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_ROOM_TOPOLOGY_INVALID"
  ) {
    return Response.json(
      {
        ok: false,
        error:
          error.message,
      },
      {
        status: 409,
      }
    )
  }

  if (
    error.message ===
      "COMMUNICATION_READ_STATE_REGRESSION_NOT_ALLOWED" ||
    error.message ===
      "DIRECT_CONVERSATION_SELF_NOT_ALLOWED" ||
    error.message ===
      "DIRECT_CONVERSATION_USER_REQUIRED" ||
    error.message ===
      "COMMUNICATION_CLIENT_ROOM_ID_INVALID" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_ROOM_CLASS_INVALID" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_ROOM_TITLE_INVALID" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_ROOM_MEMBER_INVALID" ||
    error.message.startsWith(
      "COMMUNICATION_OPERATIONAL_ROOM_MEMBER_INELIGIBLE:"
    ) ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_ROOM_ID_REQUIRED" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_TARGET_TYPE_INVALID" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_TARGET_ID_REQUIRED" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_TARGET_SUBTYPE_REQUIRED" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPE_INVALID" ||
    error.message ===
      "COMMUNICATION_OPERATIONAL_TARGET_SUBTYPE_MISMATCH" ||
    error.message ===
      "COMMUNICATION_DIRECTORY_PURPOSE_INVALID" ||
    error.message ===
      "COMMUNICATION_MESSAGE_KIND_INVALID" ||
    error.message ===
      "COMMUNICATION_MESSAGE_WORKFLOW_REFERENCE_INVALID" ||
    error.message ===
      "COMMUNICATION_MESSAGE_WORKFLOW_REFERENCE_NOT_ALLOWED" ||
    error.message ===
      "COMMUNICATION_MESSAGE_WORKFLOW_TARGET_NOT_LINKED" ||
    error.message ===
      "COMMUNICATION_TIMELINE_LIMIT_INVALID"
  ) {
    return Response.json(
      {
        ok: false,
        error:
          error.message,
      },
      {
        status: 400,
      }
    )
  }

  console.error(
    "[communications:http]",
    error
  )

  return Response.json(
    {
      ok: false,
      error:
        "COMMUNICATIONS_INTERNAL_ERROR",
    },
    {
      status: 500,
    }
  )
}
