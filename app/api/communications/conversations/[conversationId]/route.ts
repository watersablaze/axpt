import { getPrincipal } from "@/domains/auth/getPrincipal"

import { getConversation } from "@/domains/communications/conversations/getConversation"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"
import { toPublicCommunicationConversation } from "@/domains/communications/http/toPublicCommunicationConversation"

export const dynamic =
  "force-dynamic"

export async function GET(
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
      await getConversation({
        principal,
        conversationId,
      })

    return Response.json({
      ok: true,

      conversation:
        toPublicCommunicationConversation(
          conversation
        ),
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}
