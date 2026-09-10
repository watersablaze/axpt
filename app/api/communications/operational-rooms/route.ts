import { getPrincipal } from "@/domains/auth/getPrincipal"

import { getConversation } from "@/domains/communications/conversations/getConversation"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"
import { toPublicCommunicationConversation } from "@/domains/communications/http/toPublicCommunicationConversation"
import { createOperationalRoom } from "@/domains/communications/operational-rooms/createOperationalRoom"

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
        clientRoomId?: unknown
        title?: unknown
        roomClass?: unknown
        memberUserIds?: unknown
      }

    if (
      typeof body.clientRoomId !==
        "string" ||
      !body.clientRoomId.trim()
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_CLIENT_ROOM_ID_INVALID",
        },
        {
          status: 400,
        }
      )
    }

    if (
      typeof body.title !==
        "string" ||
      !body.title.trim()
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_OPERATIONAL_ROOM_TITLE_INVALID",
        },
        {
          status: 400,
        }
      )
    }

    if (
      typeof body.roomClass !==
        "string"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_OPERATIONAL_ROOM_CLASS_INVALID",
        },
        {
          status: 400,
        }
      )
    }

    if (
      !Array.isArray(
        body.memberUserIds
      ) ||
      !body.memberUserIds.every(
        userId =>
          typeof userId ===
            "string" &&
          Boolean(
            userId.trim()
          )
      )
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_OPERATIONAL_ROOM_MEMBER_INVALID",
        },
        {
          status: 400,
        }
      )
    }

    const created =
      await createOperationalRoom({
        principal,

        clientRoomId:
          body.clientRoomId,

        title:
          body.title,

        roomClass:
          body.roomClass,

        memberUserIds:
          body.memberUserIds,
      })

    /*
     * Do not serialize the command result directly.
     *
     * The command's room object carries internal
     * idempotency infrastructure. Reload through
     * the canonical Communications read model.
     */
    const conversation =
      await getConversation({
        principal,

        conversationId:
          created.conversation.id,
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
