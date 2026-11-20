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
  communicationMessageMatchesWorkflowReference,
  normalizeCommunicationMessageWorkflowReference,
  type CommunicationMessageWorkflowReference,
  type CommunicationMessageWorkflowReferenceInput,
} from "../messages/messageWorkflowReference"

import {
  isCommunicationSendableMessageKind,
  type CommunicationSendableMessageKind,
} from "../messages/messageVocabulary"

import {
  sendMessageInTransaction,
} from "../messages/sendMessageInTransaction"

import {
  isCommunicationChamberAddresseeType,
  isCommunicationChamberClass,
  type CommunicationChamberAddresseeType,
  type CommunicationChamberClass,
} from "./chamberVocabulary"

type CommunicationChamberJsonValue =
  | string
  | number
  | boolean
  | null
  | CommunicationChamberJsonValue[]
  | {
      [key: string]:
        CommunicationChamberJsonValue
    }

const MAX_MESSAGE_LENGTH = 10_000
const MAX_CLIENT_MESSAGE_ID_LENGTH = 200
const MAX_SUBJECT_LENGTH = 500
const MAX_CAPACITY_KEY_LENGTH = 200
const MAX_CAPACITY_LABEL_LENGTH = 500

function isUniqueConstraintError(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  )
}

function requireText({
  value,
  requiredError,
  invalidError,
  maxLength,
}: {
  value: string
  requiredError: string
  invalidError: string
  maxLength: number
}) {
  const normalized =
    value.trim()

  if (!normalized) {
    throw new Error(
      requiredError
    )
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new Error(
      invalidError
    )
  }

  return normalized
}

function canonicalizeJson(
  value: unknown
): string {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return (
      "[" +
      value
        .map(canonicalizeJson)
        .join(",") +
      "]"
    )
  }

  const entries =
    Object.entries(
      value as Record<string, unknown>
    ).sort(
      ([left], [right]) =>
        left.localeCompare(right)
    )

  return (
    "{" +
    entries
      .map(
        ([key, nestedValue]) =>
          `${JSON.stringify(key)}:${canonicalizeJson(
            nestedValue
          )}`
      )
      .join(",") +
    "}"
  )
}

function sha256(
  value: string
) {
  return createHash(
    "sha256"
  )
    .update(
      value,
      "utf8"
    )
    .digest(
      "hex"
    )
}

async function requireRecordInSameRoom({
  tx,
  recordId,
  conversationId,
  operationalRoomId,
  missingError,
  scopeError,
}: {
  tx: CommunicationsTransactionClient
  recordId: string
  conversationId: string
  operationalRoomId: string
  missingError: string
  scopeError: string
}) {
  const record =
    await tx.communicationChamberRecord.findUnique({
      where: {
        id:
          recordId,
      },

      select: {
        id:
          true,

        conversationId:
          true,

        operationalRoomId:
          true,
      },
    })

  if (!record) {
    throw new Error(
      missingError
    )
  }

  if (
    record.conversationId !==
      conversationId ||
    record.operationalRoomId !==
      operationalRoomId
  ) {
    throw new Error(
      scopeError
    )
  }

  return record
}

type FormalRecordComparable = {
  conversationId: string
  operationalRoomId: string
  communicationClass: string
  subject: string
  authorUserId: string
  enteredByUserId: string
  authorCapacityKey: string
  authorCapacityLabel: string
  addresseeType: string
  addresseeSnapshot: unknown
  bodyHash: string
  respondsToRecordId: string | null
  supersedesRecordId: string | null
}

function chamberRecordMatches({
  record,
  conversationId,
  operationalRoomId,
  communicationClass,
  subject,
  principalUserId,
  authorCapacityKey,
  authorCapacityLabel,
  addresseeType,
  addresseeSnapshot,
  bodyHash,
  respondsToRecordId,
  supersedesRecordId,
}: {
  record: FormalRecordComparable
  conversationId: string
  operationalRoomId: string
  communicationClass: CommunicationChamberClass
  subject: string
  principalUserId: string
  authorCapacityKey: string
  authorCapacityLabel: string
  addresseeType: CommunicationChamberAddresseeType
  addresseeSnapshot: CommunicationChamberJsonValue
  bodyHash: string
  respondsToRecordId: string | null
  supersedesRecordId: string | null
}) {
  return (
    record.conversationId ===
      conversationId &&
    record.operationalRoomId ===
      operationalRoomId &&
    record.communicationClass ===
      communicationClass &&
    record.subject ===
      subject &&
    record.authorUserId ===
      principalUserId &&
    record.enteredByUserId ===
      principalUserId &&
    record.authorCapacityKey ===
      authorCapacityKey &&
    record.authorCapacityLabel ===
      authorCapacityLabel &&
    record.addresseeType ===
      addresseeType &&
    canonicalizeJson(
      record.addresseeSnapshot
    ) ===
      canonicalizeJson(
        addresseeSnapshot
      ) &&
    record.bodyHash ===
      bodyHash &&
    record.respondsToRecordId ===
      respondsToRecordId &&
    record.supersedesRecordId ===
      supersedesRecordId
  )
}

export async function enterChamberCommunicationWithClient({
  client,
  principal,
  conversationId,
  clientMessageId,
  kind = "TEXT",
  body,
  workflowReference,
  communicationClass,
  subject,
  authorCapacityKey,
  authorCapacityLabel,
  addresseeType,
  addresseeSnapshot,
  respondsToRecordId,
  supersedesRecordId,
}: {
  client: CommunicationsDatabaseClient
  principal: Principal

  conversationId: string
  clientMessageId: string

  kind?: CommunicationSendableMessageKind
  body: string

  workflowReference?:
    | CommunicationMessageWorkflowReferenceInput
    | null

  communicationClass:
    CommunicationChamberClass

  subject: string

  authorCapacityKey: string
  authorCapacityLabel: string

  addresseeType:
    CommunicationChamberAddresseeType

  addresseeSnapshot:
    CommunicationChamberJsonValue

  respondsToRecordId?:
    | string
    | null

  supersedesRecordId?:
    | string
    | null
}) {
  /*
   * Authentication answers who the person is.
   * Capacity records whom or what they speak for.
   * Neither creates institutional authority.
   */
  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_MESSAGE_SEND
  )

  authorityKernel.require(
    principal,
    PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE
  )

  if (
    !isCommunicationSendableMessageKind(
      kind
    )
  ) {
    throw new Error(
      "COMMUNICATION_MESSAGE_KIND_INVALID"
    )
  }

  if (
    !isCommunicationChamberClass(
      communicationClass
    )
  ) {
    throw new Error(
      "COMMUNICATION_CHAMBER_CLASS_INVALID"
    )
  }

  if (
    !isCommunicationChamberAddresseeType(
      addresseeType
    )
  ) {
    throw new Error(
      "COMMUNICATION_CHAMBER_ADDRESSEE_TYPE_INVALID"
    )
  }

  const normalizedKind =
    kind

  const normalizedBody =
    requireText({
      value:
        body,

      requiredError:
        "COMMUNICATION_MESSAGE_BODY_REQUIRED",

      invalidError:
        "COMMUNICATION_MESSAGE_BODY_TOO_LONG",

      maxLength:
        MAX_MESSAGE_LENGTH,
    })

  const normalizedClientMessageId =
    requireText({
      value:
        clientMessageId,

      requiredError:
        "COMMUNICATION_CLIENT_MESSAGE_ID_REQUIRED",

      invalidError:
        "COMMUNICATION_CLIENT_MESSAGE_ID_INVALID",

      maxLength:
        MAX_CLIENT_MESSAGE_ID_LENGTH,
    })

  const normalizedSubject =
    requireText({
      value:
        subject,

      requiredError:
        "COMMUNICATION_CHAMBER_SUBJECT_REQUIRED",

      invalidError:
        "COMMUNICATION_CHAMBER_SUBJECT_INVALID",

      maxLength:
        MAX_SUBJECT_LENGTH,
    })

  const normalizedCapacityKey =
    requireText({
      value:
        authorCapacityKey,

      requiredError:
        "COMMUNICATION_CHAMBER_CAPACITY_KEY_REQUIRED",

      invalidError:
        "COMMUNICATION_CHAMBER_CAPACITY_KEY_INVALID",

      maxLength:
        MAX_CAPACITY_KEY_LENGTH,
    })

  const normalizedCapacityLabel =
    requireText({
      value:
        authorCapacityLabel,

      requiredError:
        "COMMUNICATION_CHAMBER_CAPACITY_LABEL_REQUIRED",

      invalidError:
        "COMMUNICATION_CHAMBER_CAPACITY_LABEL_INVALID",

      maxLength:
        MAX_CAPACITY_LABEL_LENGTH,
    })

  const normalizedWorkflowReference =
    normalizeCommunicationMessageWorkflowReference(
      workflowReference
    )

  const normalizedRespondsToRecordId =
    respondsToRecordId?.trim() ||
    null

  const normalizedSupersedesRecordId =
    supersedesRecordId?.trim() ||
    null

  async function resolveCanonicalPair() {
    const message =
      await client.communicationMessage.findUnique({
        where: {
          conversationId_senderUserId_clientMessageId: {
            conversationId,
            senderUserId:
              principal.userId,
            clientMessageId:
              normalizedClientMessageId,
          },
        },
      })

    if (!message) {
      return null
    }

    if (
      message.body !==
        normalizedBody ||
      message.kind !==
        normalizedKind ||
      !communicationMessageMatchesWorkflowReference({
        message,
        workflowReference:
          normalizedWorkflowReference,
      })
    ) {
      throw new Error(
        "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
      )
    }

    const record =
      await client.communicationChamberRecord.findUnique({
        where: {
          messageId:
            message.id,
        },
      })

    if (!record) {
      return null
    }

    const digest =
      sha256(
        message.body
      )

    if (
      !chamberRecordMatches({
        record,
        conversationId,
        operationalRoomId:
          record.operationalRoomId,

        communicationClass,
        subject:
          normalizedSubject,

        principalUserId:
          principal.userId,

        authorCapacityKey:
          normalizedCapacityKey,

        authorCapacityLabel:
          normalizedCapacityLabel,

        addresseeType,
        addresseeSnapshot,
        bodyHash:
          digest,

        respondsToRecordId:
          normalizedRespondsToRecordId,

        supersedesRecordId:
          normalizedSupersedesRecordId,
      })
    ) {
      throw new Error(
        "COMMUNICATION_CHAMBER_RECORD_IDEMPOTENCY_COLLISION"
      )
    }

    return {
      message,
      chamberRecord:
        record,
    }
  }

  try {
    return await client.$transaction(
      async (
        tx: CommunicationsTransactionClient
      ) => {
        /*
         * V1 Chamber records are formally situated only
         * inside an existing operational room.
         */
        const operationalRoom =
          await tx.communicationOperationalRoom.findUnique({
            where: {
              conversationId,
            },

            select: {
              id:
                true,
            },
          })

        if (!operationalRoom) {
          throw new Error(
            "COMMUNICATION_CHAMBER_OPERATIONAL_ROOM_REQUIRED"
          )
        }

        if (
          normalizedRespondsToRecordId
        ) {
          await requireRecordInSameRoom({
            tx,
            recordId:
              normalizedRespondsToRecordId,

            conversationId,

            operationalRoomId:
              operationalRoom.id,

            missingError:
              "COMMUNICATION_CHAMBER_RESPONSE_RECORD_NOT_FOUND",

            scopeError:
              "COMMUNICATION_CHAMBER_RESPONSE_SCOPE_INVALID",
          })
        }

        if (
          normalizedSupersedesRecordId
        ) {
          await requireRecordInSameRoom({
            tx,
            recordId:
              normalizedSupersedesRecordId,

            conversationId,

            operationalRoomId:
              operationalRoom.id,

            missingError:
              "COMMUNICATION_CHAMBER_SUPERSEDED_RECORD_NOT_FOUND",

            scopeError:
              "COMMUNICATION_CHAMBER_SUPERSESSION_SCOPE_INVALID",
          })
        }

        /*
         * Canonical transmission and formal record entry
         * share one transaction. The formal record cannot
         * exist without its transmitted message.
         */
        const message =
          await sendMessageInTransaction({
            tx,

            senderUserId:
              principal.userId,

            conversationId,

            clientMessageId:
              normalizedClientMessageId,

            kind:
              normalizedKind,

            body:
              normalizedBody,

            workflowReference:
              normalizedWorkflowReference,
          })

        const bodyHash =
          sha256(
            message.body
          )

        const existingRecord =
          await tx.communicationChamberRecord.findUnique({
            where: {
              messageId:
                message.id,
            },
          })

        if (existingRecord) {
          if (
            !chamberRecordMatches({
              record:
                existingRecord,

              conversationId,

              operationalRoomId:
                operationalRoom.id,

              communicationClass,

              subject:
                normalizedSubject,

              principalUserId:
                principal.userId,

              authorCapacityKey:
                normalizedCapacityKey,

              authorCapacityLabel:
                normalizedCapacityLabel,

              addresseeType,

              addresseeSnapshot,

              bodyHash,

              respondsToRecordId:
                normalizedRespondsToRecordId,

              supersedesRecordId:
                normalizedSupersedesRecordId,
            })
          ) {
            throw new Error(
              "COMMUNICATION_CHAMBER_RECORD_IDEMPOTENCY_COLLISION"
            )
          }

          return {
            message,
            chamberRecord:
              existingRecord,
          }
        }

        const chamberRecord =
          await tx.communicationChamberRecord.create({
            data: {
              messageId:
                message.id,

              conversationId,

              operationalRoomId:
                operationalRoom.id,

              communicationClass,

              subject:
                normalizedSubject,

              /*
               * V1 deliberately does not permit entering
               * a record on behalf of another user.
               *
               * Separate schema fields preserve the
               * distinction for future governed delegation.
               */
              authorUserId:
                principal.userId,

              enteredByUserId:
                principal.userId,

              authorCapacityKey:
                normalizedCapacityKey,

              authorCapacityLabel:
                normalizedCapacityLabel,

              addresseeType,

              addresseeSnapshot,

              bodyHash,

              respondsToRecordId:
                normalizedRespondsToRecordId,

              supersedesRecordId:
                normalizedSupersedesRecordId,
            },
          })

        /*
         * Formal record entry is observable separately
         * from ordinary message transmission.
         *
         * No body, addressee snapshot, or capacity payload
         * is copied into the DomainEvent.
         */
        await tx.domainEvent.create({
          data: {
            streamType:
              "COMMUNICATION_OPERATIONAL_ROOM",

            streamId:
              operationalRoom.id,

            eventType:
              COMMUNICATION_EVENT_TYPE
                .CHAMBER_RECORD_ENTERED,

            payload: {
              chamberRecordId:
                chamberRecord.id,

              messageId:
                message.id,

              conversationId,

              operationalRoomId:
                operationalRoom.id,

              communicationClass:
                chamberRecord.communicationClass,

              addresseeType:
                chamberRecord.addresseeType,

              authorUserId:
                principal.userId,

              enteredIntoRecordAt:
                chamberRecord.enteredIntoRecordAt.toISOString(),
            },

            metadata: {
              actorUserId:
                principal.userId,
            },

            occurredAt:
              chamberRecord.enteredIntoRecordAt,
          },
        })

        return {
          message,
          chamberRecord,
        }
      }
    )
  } catch (error) {
    /*
     * The database arbitrates concurrent retries.
     *
     * A duplicate may arise at either the message
     * identity or the one-record-per-message boundary.
     */
    if (
      !isUniqueConstraintError(
        error
      )
    ) {
      throw error
    }

    const canonical =
      await resolveCanonicalPair()

    if (!canonical) {
      throw error
    }

    return canonical
  }
}
