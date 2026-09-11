import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import { requireConversationWritable } from "../conversations/requireConversationWritable"
import { COMMUNICATION_EVENT_TYPE } from "../events"
import {
  requireConversationMember,
  type CommunicationMemberClient,
} from "../membership/requireConversationMember"

import type {
  CommunicationsDatabaseClient,
  CommunicationsTransactionClient,
} from "../shared/databaseTypes"

import {
  normalizeCommunicationOperationalTargetPointer,
  requireCommunicationOperationalTargetExists,
} from "../operational/operationalTargetPointer"

export type {
  CommunicationOperationalTargetType,
} from "../operational/operationalVocabulary"

function isUniqueConstraintError(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
}

export async function linkOperationalRoomTargetWithClient({
  client,
  principal,
  roomId,
  targetType,
  targetSubtype,
  targetId,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  roomId: string
  targetType: string
  targetSubtype: string
  targetId: string
}) {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE
  )

  const normalizedRoomId =
    roomId.trim()

  if (!normalizedRoomId) {
    throw new Error(
      "COMMUNICATION_OPERATIONAL_ROOM_ID_REQUIRED"
    )
  }

  const {
    targetType:
      normalizedTargetType,

    targetSubtype:
      normalizedTargetSubtype,

    targetId:
      normalizedTargetId,
  } =
    normalizeCommunicationOperationalTargetPointer({
      targetType,
      targetSubtype,
      targetId,
    })

  /*
   * Natural idempotency identity:
   *
   * roomId + targetType + targetSubtype + targetId
   */
  const existing =
    await client.communicationOperationalLink.findUnique({
      where: {
        roomId_targetType_targetSubtype_targetId: {
          roomId:
            normalizedRoomId,

          targetType:
            normalizedTargetType,

          targetSubtype:
            normalizedTargetSubtype,

          targetId:
            normalizedTargetId,
        },
      },
    })

  if (existing) {
    const room =
      await client.communicationOperationalRoom.findUnique({
        where: {
          id:
            normalizedRoomId,
        },

        select: {
          conversationId:
            true,
        },
      })

    if (!room) {
      throw new Error(
        "COMMUNICATION_OPERATIONAL_ROOM_NOT_FOUND"
      )
    }

    await requireConversationMember(
      client as unknown as CommunicationMemberClient,
      room.conversationId,
      principal.userId
    )

    return existing
  }

  try {
    return await client.$transaction(
      async (
        tx: CommunicationsTransactionClient
      ) => {
        const room =
          await tx.communicationOperationalRoom.findUnique({
            where: {
              id:
                normalizedRoomId,
            },

            select: {
              id:
                true,

              conversationId:
                true,

              conversation: {
                select: {
                  kind:
                    true,
                },
              },
            },
          })

        if (!room) {
          throw new Error(
            "COMMUNICATION_OPERATIONAL_ROOM_NOT_FOUND"
          )
        }

        if (
          room.conversation.kind !==
          "GROUP"
        ) {
          throw new Error(
            "COMMUNICATION_OPERATIONAL_ROOM_TOPOLOGY_INVALID"
          )
        }

        await requireConversationMember(
          tx as unknown as CommunicationMemberClient,
          room.conversationId,
          principal.userId
        )

        await requireConversationWritable(
          tx,
          room.conversationId
        )

        /*
         * Validation only.
         * No mutation of the institutional target.
         */
        await requireCommunicationOperationalTargetExists({
          tx,
          targetType:
            normalizedTargetType,

          targetSubtype:
            normalizedTargetSubtype,

          targetId:
            normalizedTargetId,
        })

        const link =
          await tx.communicationOperationalLink.create({
            data: {
              roomId:
                room.id,

              targetType:
                normalizedTargetType,

              targetSubtype:
                normalizedTargetSubtype,

              targetId:
                normalizedTargetId,

              linkedByUserId:
                principal.userId,
            },
          })

        await tx.domainEvent.create({
          data: {
            streamType:
              "COMMUNICATION_OPERATIONAL_ROOM",

            streamId:
              room.id,

            eventType:
              COMMUNICATION_EVENT_TYPE
                .OPERATIONAL_TARGET_LINKED,

            payload: {
              roomId:
                room.id,

              conversationId:
                room.conversationId,

              linkId:
                link.id,

              targetType:
                link.targetType,

              targetSubtype:
                link.targetSubtype,

              targetId:
                link.targetId,
            },

            metadata: {
              actorUserId:
                principal.userId,
            },

            occurredAt:
              link.linkedAt,
          },
        })

        return link
      }
    )
  } catch (error: unknown) {
    if (
      !isUniqueConstraintError(
        error
      )
    ) {
      throw error
    }

    const winner =
      await client.communicationOperationalLink.findUnique({
        where: {
          roomId_targetType_targetSubtype_targetId: {
            roomId:
              normalizedRoomId,

            targetType:
              normalizedTargetType,

            targetSubtype:
              normalizedTargetSubtype,

            targetId:
              normalizedTargetId,
          },
        },
      })

    if (!winner) {
      throw error
    }

    return winner
  }
}
