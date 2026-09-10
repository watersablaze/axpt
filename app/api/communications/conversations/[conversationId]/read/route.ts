import { getPrincipal } from "@/domains/auth/getPrincipal"

import { markConversationRead } from "@/domains/communications/membership/markConversationRead"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"

export const dynamic =
  "force-dynamic"

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      conversationId: string
    }>
  }
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

  const {
    conversationId,
  } =
    await params

  try {
    const body =
      await request.json() as {
        throughMessageId?: unknown
      }

    if (
      typeof body.throughMessageId !==
        "string" ||
      !body.throughMessageId.trim()
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATIONS_READ_MESSAGE_REQUIRED",
        },
        {
          status: 400,
        }
      )
    }

    const membership =
      await markConversationRead({
        principal,
        conversationId,

        throughMessageId:
          body.throughMessageId,
      })

    return Response.json({
      ok: true,
      membership,
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}
