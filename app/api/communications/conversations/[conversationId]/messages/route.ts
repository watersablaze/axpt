import { getPrincipal } from "@/domains/auth/getPrincipal"

import { listMessages } from "@/domains/communications/messages/listMessages"
import { sendMessage } from "@/domains/communications/messages/sendMessage"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"

export const dynamic =
  "force-dynamic"

export async function GET(
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

  const url =
    new URL(
      request.url
    )

  const cursor =
    url.searchParams.get(
      "cursor"
    ) ?? undefined

  const rawLimit =
    url.searchParams.get(
      "limit"
    )

  const parsedLimit =
    rawLimit
      ? Number(rawLimit)
      : undefined

  const limit =
    parsedLimit !== undefined &&
    Number.isFinite(
      parsedLimit
    )
      ? parsedLimit
      : undefined

  try {
    const messages =
      await listMessages({
        principal,
        conversationId,
        cursor,
        limit,
      })

    return Response.json({
      ok: true,
      messages,
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}

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
    const requestBody =
      await request.json() as {
        body?: unknown
        clientMessageId?: unknown
      }

    if (
      typeof requestBody.clientMessageId !==
      "string" ||
      !requestBody.clientMessageId.trim()
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_CLIENT_MESSAGE_ID_REQUIRED",
        },
        {
          status: 400,
        }
      )
    }

    if (
      typeof requestBody.body !==
      "string"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATIONS_MESSAGE_BODY_REQUIRED",
        },
        {
          status: 400,
        }
      )
    }

    const message =
      await sendMessage({
        principal,
        conversationId,
        clientMessageId:
          requestBody.clientMessageId,
        body:
          requestBody.body,
      })

    return Response.json({
      ok: true,
      message,
    })
  } catch (error) {
    return communicationHttpError(
      error
    )
  }
}
