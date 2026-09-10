import { getPrincipal } from "@/domains/auth/getPrincipal"

import {
  listCommunicationDirectory,
} from "@/domains/communications/directory/listCommunicationDirectory"
import type {
  CommunicationDirectoryPurpose,
} from "@/domains/communications/directory/listCommunicationDirectoryWithClient"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"

export const dynamic =
  "force-dynamic"

export async function GET(
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
    const url =
      new URL(
        request.url
      )

    const requestedPurpose =
      url.searchParams.get(
        "purpose"
      )

    if (
      requestedPurpose !==
        null &&
      requestedPurpose !==
        "DIRECT" &&
      requestedPurpose !==
        "GROUP"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_DIRECTORY_PURPOSE_INVALID",
        },
        {
          status: 400,
        }
      )
    }

    const purpose:
      CommunicationDirectoryPurpose =
        requestedPurpose ??
        "DIRECT"

    const users =
      await listCommunicationDirectory({
        principal,
        purpose,
      })

    return Response.json({
      ok: true,
      purpose,
      users,
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}
