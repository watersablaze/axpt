import { getPrincipal } from "@/domains/auth/getPrincipal"

import { archiveConversation } from "@/domains/communications/conversations/archiveConversation"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"

export const dynamic =
  "force-dynamic"

export async function POST(
  _request: Request,
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
    const conversation =
      await archiveConversation({
        principal,
        conversationId,
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
