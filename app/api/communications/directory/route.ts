import { getPrincipal } from "@/domains/auth/getPrincipal"

import { listCommunicationDirectory } from "@/domains/communications/directory/listCommunicationDirectory"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"

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
    const users =
      await listCommunicationDirectory({
        principal,
      })

    return Response.json({
      ok: true,
      users,
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}
