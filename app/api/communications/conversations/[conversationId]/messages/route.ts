import { getPrincipal } from "@/domains/auth/getPrincipal"

import { listMessages } from "@/domains/communications/messages/listMessages"
import { sendMessage } from "@/domains/communications/messages/sendMessage"
import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"
import {
  isCommunicationSendableMessageKind,
} from "@/domains/communications/messages/messageVocabulary"

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
        kind?: unknown
        workflowReference?: unknown
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

    const kind =
      requestBody.kind ??
      "TEXT"

    if (
      !isCommunicationSendableMessageKind(
        kind
      )
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "COMMUNICATION_MESSAGE_KIND_INVALID",
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

    let workflowReference:
      | {
          targetType: string
          targetSubtype: string
          targetId: string
        }
      | null =
        null

    if (
      requestBody.workflowReference !==
        undefined &&
      requestBody.workflowReference !==
        null
    ) {
      if (
        typeof requestBody.workflowReference !==
          "object" ||
        Array.isArray(
          requestBody.workflowReference
        )
      ) {
        return Response.json(
          {
            ok: false,
            error:
              "COMMUNICATION_MESSAGE_WORKFLOW_REFERENCE_INVALID",
          },
          {
            status: 400,
          }
        )
      }

      const rawWorkflowReference =
        requestBody.workflowReference as
          Record<string, unknown>

      if (
        typeof rawWorkflowReference.targetType !==
          "string" ||
        typeof rawWorkflowReference.targetSubtype !==
          "string" ||
        typeof rawWorkflowReference.targetId !==
          "string"
      ) {
        return Response.json(
          {
            ok: false,
            error:
              "COMMUNICATION_MESSAGE_WORKFLOW_REFERENCE_INVALID",
          },
          {
            status: 400,
          }
        )
      }

      workflowReference = {
        targetType:
          rawWorkflowReference.targetType,

        targetSubtype:
          rawWorkflowReference.targetSubtype,

        targetId:
          rawWorkflowReference.targetId,
      }
    }

    const message =
      await sendMessage({
        principal,
        conversationId,
        clientMessageId:
          requestBody.clientMessageId,
        kind,
        body:
          requestBody.body,
        workflowReference,
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
