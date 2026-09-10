import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes"

const STREAM_EVENT_TYPES = [
  "COMMUNICATION_CONVERSATION_CREATED",
  "COMMUNICATION_MESSAGE_SENT",
] as const

type CommunicationMembershipRow = {
  conversationId: string
}

type CommunicationEventRow = {
  id: string
  eventType: string
  streamId: string
  occurredAt: Date
  createdAt: Date
  payload: unknown
}

type CommunicationEventPayload = {
  messageId?: string
  senderUserId?: string
  createdAt?: string
}

export type CommunicationRealtimeSignal = {
  id: string
  type: string
  conversationId: string
  messageId?: string
  senderUserId?: string
  createdAt: string
}

export type CommunicationRealtimeRecord = {
  occurredAt: Date
  signal: CommunicationRealtimeSignal
}

function decodePayload(
  value: unknown
): CommunicationEventPayload {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {}
  }

  const row =
    value as Record<string, unknown>

  return {
    messageId:
      typeof row.messageId === "string"
        ? row.messageId
        : undefined,

    senderUserId:
      typeof row.senderUserId === "string"
        ? row.senderUserId
        : undefined,

    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : undefined,
  }
}

export async function loadCommunicationRealtimeSignalsWithClient({
  client,
  principal,
  since,
  limit = 100,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  since: Date
  limit?: number
}): Promise<CommunicationRealtimeRecord[]> {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_ACCESS
  )

  const memberships =
    await client.communicationMember.findMany({
      where: {
        userId:
          principal.userId,
        leftAt:
          null,

        conversation: {
          status:
            "ACTIVE",
        },
      },

      select: {
        conversationId:
          true,
      },
    })

  const conversationIds =
    memberships.map(
      (
        membership:
          CommunicationMembershipRow
      ) =>
        membership.conversationId
    )

  if (
    conversationIds.length === 0
  ) {
    return []
  }

  const boundedLimit =
    Math.max(
      1,
      Math.min(
        limit,
        100
      )
    )

  const events =
    await client.domainEvent.findMany({
      where: {
        streamType:
          "COMMUNICATION_CONVERSATION",

        streamId: {
          in:
            conversationIds,
        },

        eventType: {
          in: [
            ...STREAM_EVENT_TYPES,
          ],
        },

        occurredAt: {
          gte:
            since,
        },
      },

      orderBy: [
        {
          occurredAt:
            "asc",
        },
        {
          createdAt:
            "asc",
        },
      ],

      take:
        boundedLimit,
    })

  return events.map(
    (
      event:
        CommunicationEventRow
    ) => {
      const payload =
        decodePayload(
          event.payload
        )

      return {
        occurredAt:
          event.occurredAt,

        signal: {
          id:
            event.id,

          type:
            event.eventType,

          conversationId:
            event.streamId,

          messageId:
            payload.messageId,

          senderUserId:
            payload.senderUserId,

          createdAt:
            payload.createdAt ??
            event.occurredAt.toISOString(),
        },
      }
    }
  )
}
