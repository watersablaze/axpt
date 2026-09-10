import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import { COMMUNICATION_EVENT_TYPE } from "../events"
import type {
  CommunicationsDatabaseClient,
  CommunicationsTransactionClient,
} from "../shared/databaseTypes"

import { buildDirectConversationKey } from "./buildDirectConversationKey"

function isUniqueConstraintError(
  error: unknown
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  )
}

export async function createDirectConversationWithClient({
  client,
  principal,
  otherUserId,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  otherUserId: string
}) {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_DIRECT_CREATE
  )

  const directKey =
    buildDirectConversationKey(
      principal.userId,
      otherUserId
    )

  const existing =
    await client.communicationConversation.findUnique({
      where: {
        directKey,
      },
      include: {
        members: true,
      },
    })

  if (existing) {
    return existing
  }

  try {
    return await client.$transaction(
      async (
        tx: CommunicationsTransactionClient
      ) => {
        const otherUser =
          await tx.user.findUnique({
            where: {
              id: otherUserId,
            },
            select: {
              id: true,
            },
          })

        if (!otherUser) {
          throw new Error(
            "COMMUNICATION_RECIPIENT_NOT_FOUND"
          )
        }

        const conversation =
          await tx.communicationConversation.create({
            data: {
              kind: "DIRECT",
              status: "ACTIVE",
              directKey,
              createdByUserId:
                principal.userId,

              members: {
                create: [
                  {
                    userId:
                      principal.userId,
                    role:
                      "MEMBER",
                  },
                  {
                    userId:
                      otherUserId,
                    role:
                      "MEMBER",
                  },
                ],
              },
            },

            include: {
              members: true,
            },
          })

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
                "DIRECT",
            },

            metadata: {
              actorUserId:
                principal.userId,
            },

            occurredAt:
              new Date(),
          },
        })

        return conversation
      }
    )
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      const existing =
        await client.communicationConversation.findUnique({
          where: {
            directKey,
          },
          include: {
            members: true,
          },
        })

      if (existing) {
        return existing
      }
    }

    throw error
  }
}
