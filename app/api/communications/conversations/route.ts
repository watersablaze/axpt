import { getPrincipal } from "@/domains/auth/getPrincipal"

import { listConversations } from "@/domains/communications/conversations/listConversations"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"
import { toPublicCommunicationConversation } from "@/domains/communications/http/toPublicCommunicationConversation"

export const dynamic =
  "force-dynamic"

export async function GET() {
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
    const conversations =
      await listConversations({
        principal,
      })

    return Response.json({
      ok: true,

      conversations:
        conversations.map(
          toPublicCommunicationConversation
        ),
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}
