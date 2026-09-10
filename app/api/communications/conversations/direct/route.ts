import { getPrincipal } from "@/domains/auth/getPrincipal"

import { createDirectConversation } from "@/domains/communications/conversations/createDirectConversation"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"

export const dynamic =
  "force-dynamic"

export async function POST(
  request: Request
) {
  const principal =
    await getPrincipal()

  if (!principal) {
    return Response.json(
      {
        ok: false,
        error:
          "COMMUNICATIONS_AUTHENTICATION_REQUIRED",
      },
      {
        status: 401,
      }
    )
  }

  try {
    const body =
      await request.json() as {
        otherUserId?: unknown
      }

    if (
      typeof body.otherUserId !==
        "string" ||
      !body.otherUserId.trim()
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATIONS_OTHER_USER_REQUIRED",
        },
        {
          status: 400,
        }
      )
    }

    const conversation =
      await createDirectConversation({
        principal,

        otherUserId:
          body.otherUserId,
      })

    return Response.json({
      ok: true,
      conversation,
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}
