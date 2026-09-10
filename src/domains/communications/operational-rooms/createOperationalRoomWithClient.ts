import { createHash } from "node:crypto"

import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import { COMMUNICATION_EVENT_TYPE } from "../events"
import type {
  CommunicationsDatabaseClient,
  CommunicationsTransactionClient,
} from "../shared/databaseTypes"

import {
  COMMUNICATION_OPERATIONAL_ROOM_CLASSES,
  type CommunicationOperationalRoomClass,
} from "../operational/operationalVocabulary"

export type {
  CommunicationOperationalRoomClass,
} from "../operational/operationalVocabulary"

const MAX_TITLE_LENGTH = 200
const MAX_CLIENT_ROOM_ID_LENGTH = 200

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

function canonicalize(
  value: unknown
): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>
      )
        .sort(
          ([left], [right]) =>
            left.localeCompare(right)
        )
        .map(
          ([key, nestedValue]) => [
            key,
            canonicalize(nestedValue),
          ]
        )
    )
  }

  return value
}

function normalizeTitle(
  value: string
) {
  const title =
    value.trim()

  if (!title) {
    throw new Error(
      "COMMUNICATION_OPERATIONAL_ROOM_TITLE_REQUIRED"
    )
  }

  if (
    title.length >
    MAX_TITLE_LENGTH
  ) {
    throw new Error(
      "COMMUNICATION_OPERATIONAL_ROOM_TITLE_TOO_LONG"
    )
  }

  return title
}

function normalizeClientRoomId(
  value: string
) {
  const clientRoomId =
    value.trim()

  if (!clientRoomId) {
    throw new Error(
      "COMMUNICATION_CLIENT_ROOM_ID_REQUIRED"
    )
  }

  if (
    clientRoomId.length >
    MAX_CLIENT_ROOM_ID_LENGTH
  ) {
    throw new Error(
      "COMMUNICATION_CLIENT_ROOM_ID_INVALID"
    )
  }

  return clientRoomId
}

function requireRoomClass(
  value: string
): CommunicationOperationalRoomClass {
  if (
    !COMMUNICATION_OPERATIONAL_ROOM_CLASSES.includes(
      value as CommunicationOperationalRoomClass
    )
  ) {
    throw new Error(
      "COMMUNICATION_OPERATIONAL_ROOM_CLASS_INVALID"
    )
  }

  return value as CommunicationOperationalRoomClass
}

function normalizeMemberUserIds({
  creatorUserId,
  memberUserIds,
}: {
  creatorUserId: string
  memberUserIds: string[]
}) {
  return [
    ...new Set(
      memberUserIds
        .map(
          userId =>
            userId.trim()
        )
        .filter(Boolean)
        .filter(
          userId =>
            userId !==
            creatorUserId
        )
    ),
  ].sort(
    (left, right) =>
      left.localeCompare(right)
  )
}

function fingerprintRoomCreationRequest({
  actorUserId,
  title,
  roomClass,
  memberUserIds,
}: {
  actorUserId: string
  title: string
  roomClass: CommunicationOperationalRoomClass
  memberUserIds: string[]
}) {
  const materialRequest = {
    actorUserId,
    title,
    roomClass,
    memberUserIds,
  }

  return createHash("sha256")
    .update(
      JSON.stringify(
        canonicalize(
          materialRequest
        )
      )
    )
    .digest("hex")
}

export async function createOperationalRoomWithClient({
  client,
  principal,
  clientRoomId,
  title,
  roomClass,
  memberUserIds,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  clientRoomId: string
  title: string
  roomClass: string
  memberUserIds: string[]
}) {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_GROUP_CREATE
  )

  const normalizedClientRoomId =
    normalizeClientRoomId(
      clientRoomId
    )

  const normalizedTitle =
    normalizeTitle(
      title
    )

  const normalizedRoomClass =
    requireRoomClass(
      roomClass
    )

  const additionalMemberUserIds =
    normalizeMemberUserIds({
      creatorUserId:
        principal.userId,

      memberUserIds,
    })

  const requestFingerprint =
    fingerprintRoomCreationRequest({
      actorUserId:
        principal.userId,

      title:
        normalizedTitle,

      roomClass:
        normalizedRoomClass,

      memberUserIds:
        additionalMemberUserIds,
    })

  /*
   * Resolve durable history before revalidating
   * present-day member eligibility.
   */
  const existing =
    await client.communicationOperationalRoom.findUnique({
      where: {
        createdByUserId_clientRoomId: {
          createdByUserId:
            principal.userId,

          clientRoomId:
            normalizedClientRoomId,
        },
      },

      include: {
        links:
          true,

        conversation: {
          include: {
            members:
              true,
          },
        },
      },
    })

  if (existing) {
    if (
      existing.requestFingerprint !==
      requestFingerprint
    ) {
      throw new Error(
        "COMMUNICATION_OPERATIONAL_ROOM_IDEMPOTENCY_COLLISION"
      )
    }

    const {
      conversation,
      ...room
    } = existing

    return {
      room,
      conversation,
    }
  }

  try {
    return await client.$transaction(
      async (
        tx: CommunicationsTransactionClient
      ) => {
        if (
          additionalMemberUserIds.length >
          0
        ) {
          const eligibleUsers =
            await tx.user.findMany({
              where: {
                id: {
                  in:
                    additionalMemberUserIds,
                },

                userRoles: {
                  some: {
                    isActive:
                      true,

                    revokedAt:
                      null,

                    role: {
                      rolePermissions: {
                        some: {
                          permission: {
                            key:
                              PERMISSIONS.COMMUNICATIONS_ACCESS,
                          },
                        },
                      },
                    },
                  },
                },
              },

              select: {
                id:
                  true,
              },
            })

          const eligibleIds =
            new Set(
              eligibleUsers.map(
                (
                  user: {
                    id: string
                  }
                ) =>
                  user.id
              )
            )

          const ineligibleIds =
            additionalMemberUserIds.filter(
              userId =>
                !eligibleIds.has(
                  userId
                )
            )

          if (
            ineligibleIds.length >
            0
          ) {
            throw new Error(
              `COMMUNICATION_OPERATIONAL_ROOM_MEMBER_INELIGIBLE:${ineligibleIds.join(
                ","
              )}`
            )
          }
        }

        const conversation =
          await tx.communicationConversation.create({
            data: {
              kind:
                "GROUP",

              status:
                "ACTIVE",

              title:
                normalizedTitle,

              createdByUserId:
                principal.userId,

              members: {
                create: [
                  {
                    userId:
                      principal.userId,

                    role:
                      "OWNER",
                  },

                  ...additionalMemberUserIds.map(
                    userId => ({
                      userId,

                      role:
                        "MEMBER" as const,
                    })
                  ),
                ],
              },

              operationalRoom: {
                create: {
                  clientRoomId:
                    normalizedClientRoomId,

                  requestFingerprint,

                  roomClass:
                    normalizedRoomClass,

                  createdByUserId:
                    principal.userId,
                },
              },
            },

            include: {
              members:
                true,

              operationalRoom: {
                include: {
                  links:
                    true,
                },
              },
            },
          })

        const room =
          conversation.operationalRoom

        if (!room) {
          throw new Error(
            "COMMUNICATION_OPERATIONAL_ROOM_CREATE_FAILED"
          )
        }

        const occurredAt =
          new Date()

        await tx.domainEvent.create({
          data: {
            streamType:
              "COMMUNICATION_CONVERSATION",

            streamId:
              conversation.id,

            eventType:
              COMMUNICATION_EVENT_TYPE
                .CONVERSATION_CREATED,

            payload: {
              conversationId:
                conversation.id,

              kind:
                "GROUP",
            },

            metadata: {
              actorUserId:
                principal.userId,
            },

            occurredAt,
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
                .OPERATIONAL_ROOM_CREATED,

            payload: {
              roomId:
                room.id,

              conversationId:
                conversation.id,

              roomClass:
                room.roomClass,
            },

            metadata: {
              actorUserId:
                principal.userId,
            },

            occurredAt,
          },
        })

        return {
          room,
          conversation,
        }
      }
    )
  } catch (error: unknown) {
    /*
     * Concurrent identical creations may both
     * pass the initial lookup. The compound
     * unique key arbitrates the race.
     */
    if (
      !isUniqueConstraintError(
        error
      )
    ) {
      throw error
    }

    const winner =
      await client.communicationOperationalRoom.findUnique({
        where: {
          createdByUserId_clientRoomId: {
            createdByUserId:
              principal.userId,

            clientRoomId:
              normalizedClientRoomId,
          },
        },

        include: {
          links:
            true,

          conversation: {
            include: {
              members:
                true,
            },
          },
        },
      })

    if (!winner) {
      throw error
    }

    if (
      winner.requestFingerprint !==
      requestFingerprint
    ) {
      throw new Error(
        "COMMUNICATION_OPERATIONAL_ROOM_IDEMPOTENCY_COLLISION"
      )
    }

    const {
      conversation,
      ...room
    } = winner

    return {
      room,
      conversation,
    }
  }
}
