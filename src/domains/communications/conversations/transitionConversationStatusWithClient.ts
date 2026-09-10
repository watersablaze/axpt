import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import { COMMUNICATION_EVENT_TYPE } from "../events"

import {
  requireConversationMember,
  type CommunicationMemberClient,
} from "../membership/requireConversationMember"

import type {
  CommunicationsDatabaseClient,
  CommunicationsTransactionClient,
} from "../shared/databaseTypes"

type ConversationStatus =
  | "ACTIVE"
  | "ARCHIVED"

export async function transitionConversationStatusWithClient({
  client,
  principal,
  conversationId,
  fromStatus,
  toStatus,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  conversationId: string
  fromStatus: ConversationStatus
  toStatus: ConversationStatus
}) {
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE
  )

  if (
    fromStatus === toStatus
  ) {
    throw new Error(
      "COMMUNICATION_CONVERSATION_TRANSITION_INVALID"
    )
  }

  return client.$transaction(
    async (
      tx: CommunicationsTransactionClient
    ) => {
      await requireConversationMember(
        tx as unknown as CommunicationMemberClient,
        conversationId,
        principal.userId
      )

      const before =
        await tx.communicationConversation.findUnique({
          where: {
            id:
              conversationId,
          },
          select: {
            id: true,
            status: true,
          },
        })

      if (!before) {
        throw new Error(
          "COMMUNICATION_CONVERSATION_NOT_FOUND"
        )
      }

      /*
       * Target-state retry:
       * command is already satisfied and must not
       * emit another lifecycle event.
       */
      if (
        before.status ===
        toStatus
      ) {
        return tx.communicationConversation.findUniqueOrThrow({
          where: {
            id:
              conversationId,
          },
        })
      }

      if (
        before.status !==
        fromStatus
      ) {
        throw new Error(
          "COMMUNICATION_CONVERSATION_TRANSITION_INVALID"
        )
      }

      const occurredAt =
        new Date()

      /*
       * Conditional update is the concurrency
       * arbiter. Only one request may move the
       * expected source state.
       */
      const transition =
        await tx.communicationConversation.updateMany({
          where: {
            id:
              conversationId,
            status:
              fromStatus,
          },

          data:
            toStatus ===
            "ARCHIVED"
              ? {
                  status:
                    "ARCHIVED",
                  archivedAt:
                    occurredAt,
                  updatedAt:
                    occurredAt,
                }
              : {
                  status:
                    "ACTIVE",
                  archivedAt:
                    null,
                  updatedAt:
                    occurredAt,
                },
        })

      /*
       * Another transaction may have completed
       * the identical transition first.
       */
      if (
        transition.count === 0
      ) {
        const concurrent =
          await tx.communicationConversation.findUnique({
            where: {
              id:
                conversationId,
            },
          })

        if (!concurrent) {
          throw new Error(
            "COMMUNICATION_CONVERSATION_NOT_FOUND"
          )
        }

        if (
          concurrent.status ===
          toStatus
        ) {
          return concurrent
        }

        throw new Error(
          "COMMUNICATION_CONVERSATION_TRANSITION_CONFLICT"
        )
      }

      await tx.domainEvent.create({
        data: {
          streamType:
            "COMMUNICATION_CONVERSATION",

          streamId:
            conversationId,

          eventType:
            toStatus ===
            "ARCHIVED"
              ? COMMUNICATION_EVENT_TYPE
                  .CONVERSATION_ARCHIVED
              : COMMUNICATION_EVENT_TYPE
                  .CONVERSATION_REACTIVATED,

          payload: {
            conversationId,
            fromStatus,
            toStatus,
          },

          metadata: {
            actorUserId:
              principal.userId,
          },

          occurredAt,
        },
      })

      return tx.communicationConversation.findUniqueOrThrow({
        where: {
          id:
            conversationId,
        },
      })
    }
  )
}
