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
      "COMMUNICATION_READ_MESSAGE_NOT_FOUND"
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
      "COMMUNICATION_CONVERSATION_TRANSITION_CONFLICT"
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
      "DIRECT_CONVERSATION_USER_REQUIRED"
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
