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
  })
}

main().catch(
  error => {
    console.error(error)

    process.exitCode =
      1
  }
)
