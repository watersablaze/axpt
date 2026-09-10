import { getPrincipal } from "@/domains/auth/getPrincipal"

import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"
import { linkOperationalRoomTarget } from "@/domains/communications/operational-links/linkOperationalRoomTarget"

export const dynamic =
  "force-dynamic"

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      roomId: string
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
    roomId,
  } =
    await params

  try {
    const body =
      await request.json() as {
        targetType?: unknown
        targetSubtype?: unknown
        targetId?: unknown
      }

    if (
      typeof body.targetType !==
        "string"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_OPERATIONAL_TARGET_TYPE_INVALID",
        },
        {
          status: 400,
        }
      )
    }

    if (
      typeof body.targetSubtype !==
        "string"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_OPERATIONAL_TARGET_SUBTYPE_REQUIRED",
        },
        {
          status: 400,
        }
      )
    }

    if (
      typeof body.targetId !==
        "string"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_OPERATIONAL_TARGET_ID_REQUIRED",
        },
        {
          status: 400,
        }
      )
    }

    const link =
      await linkOperationalRoomTarget({
        principal,
        roomId,

        targetType:
          body.targetType,

        targetSubtype:
          body.targetSubtype,

        targetId:
          body.targetId,
      })

    return Response.json({
      ok: true,
      link,
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}
