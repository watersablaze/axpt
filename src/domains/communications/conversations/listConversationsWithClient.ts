import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes"

type ConversationListMember = {
  id: string
  conversationId: string
  userId: string
  role: unknown
  joinedAt: Date
  leftAt: Date | null
  lastReadMessageId: string | null
  lastReadAt: Date | null

  user: {
    id: string
    email: string
    displayName: string | null
    name: string | null
  }

  lastReadMessage: {
    id: string
    createdAt: Date
  } | null
}

type ConversationListMessage = {
  id: string
  conversationId: string
  senderUserId: string | null
  kind: unknown
  body: string | null
  metadata: unknown
  createdAt: Date
  editedAt: Date | null
  deletedAt: Date | null
  systemCode: string | null
}

type ConversationListOperationalLink = {
  id: string
  roomId: string
  targetType: unknown
  targetSubtype: string
  targetId: string
  linkedByUserId: string
  linkedAt: Date
}

type ConversationListOperationalRoom = {
  id: string
  conversationId: string
  clientRoomId: string
  requestFingerprint: string
  roomClass: unknown
  createdByUserId: string
  createdAt: Date
  updatedAt: Date
  links: ConversationListOperationalLink[]
}

type ConversationListRecord = {
  id: string
  kind: unknown
  status: unknown
  title: string | null
  directKey: string | null
  createdByUserId: string
  createdAt: Date
  updatedAt: Date
  archivedAt: Date | null
  members: ConversationListMember[]
  messages: ConversationListMessage[]
  operationalRoom: ConversationListOperationalRoom | null
}

export async function listConversationsWithClient({
  client,
  principal,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
}) {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_ACCESS
  )

  const conversations =
    await client.communicationConversation.findMany({
      where: {
        members: {
          some: {
            userId: principal.userId,
            leftAt: null,
          },
        },
      },

      include: {
        members: {
          where: {
            leftAt: null,
          },

          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                name: true,
              },
            },

            lastReadMessage: {
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
        },

        messages: {
          take: 1,

          orderBy: {
            createdAt: "desc",
          },
        },

        operationalRoom: {
          include: {
            links: {
              orderBy: {
                linkedAt: "asc",
              },
            },
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    }) as ConversationListRecord[]

  return Promise.all(
    conversations.map(
      async (conversation) => {
        const membership =
          conversation.members.find(
            (member) =>
              member.userId === principal.userId
          )

        if (!membership) {
          throw new Error(
            "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
          )
        }

        const unreadCount =
          await client.communicationMessage.count({
            where: {
              conversationId:
                conversation.id,

              senderUserId: {
                not:
                  principal.userId,
              },

              ...(membership.lastReadMessage
                ? {
                    createdAt: {
                      gt:
                        membership
                          .lastReadMessage
                          .createdAt,
                    },
                  }
                : {}),
            },
          })

        const members =
          conversation.members.map(
            (member) => {
              const {
                lastReadMessage:
                  _lastReadMessage,
                ...publicMember
              } = member

              return publicMember
            }
          )

        return {
          ...conversation,
          members,
          unreadCount,
        }
      }
    )
  )
}
