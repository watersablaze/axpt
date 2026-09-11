import type {
  CommunicationsTransactionClient,
} from "../shared/databaseTypes"

import {
  COMMUNICATION_OPERATIONAL_TARGET_TYPES,
  COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPES,
  type CommunicationOperationalTargetType,
} from "./operationalVocabulary"

const TREASURY_AGGREGATE_TYPES =
  new Set<string>(
    COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPES
  )

export type CommunicationOperationalTargetPointer = {
  targetType: CommunicationOperationalTargetType
  targetSubtype: string
  targetId: string
}

function requireTargetType(
  value: string
): CommunicationOperationalTargetType {
  if (
    !COMMUNICATION_OPERATIONAL_TARGET_TYPES.includes(
      value as CommunicationOperationalTargetType
    )
  ) {
    throw new Error(
      "COMMUNICATION_OPERATIONAL_TARGET_TYPE_INVALID"
    )
  }

  return value as CommunicationOperationalTargetType
}

function normalizeTargetSubtype({
  targetType,
  targetSubtype,
}: {
  targetType: CommunicationOperationalTargetType
  targetSubtype: string
}) {
  const normalized =
    targetSubtype.trim()

  if (!normalized) {
    throw new Error(
      "COMMUNICATION_OPERATIONAL_TARGET_SUBTYPE_REQUIRED"
    )
  }

  if (
    targetType ===
    "TREASURY_GATEWAY_AGGREGATE"
  ) {
    if (
      !TREASURY_AGGREGATE_TYPES.has(
        normalized
      )
    ) {
      throw new Error(
        "COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPE_INVALID"
      )
    }

    return normalized
  }

  if (
    normalized !==
    targetType
  ) {
    throw new Error(
      "COMMUNICATION_OPERATIONAL_TARGET_SUBTYPE_MISMATCH"
    )
  }

  return normalized
}

function normalizeTargetId(
  value: string
) {
  const targetId =
    value.trim()

  if (!targetId) {
    throw new Error(
      "COMMUNICATION_OPERATIONAL_TARGET_ID_REQUIRED"
    )
  }

  return targetId
}

export function normalizeCommunicationOperationalTargetPointer({
  targetType,
  targetSubtype,
  targetId,
}: {
  targetType: string
  targetSubtype: string
  targetId: string
}): CommunicationOperationalTargetPointer {
  const normalizedTargetType =
    requireTargetType(
      targetType
    )

  const normalizedTargetSubtype =
    normalizeTargetSubtype({
      targetType:
        normalizedTargetType,
      targetSubtype,
    })

  const normalizedTargetId =
    normalizeTargetId(
      targetId
    )

  return {
    targetType:
      normalizedTargetType,

    targetSubtype:
      normalizedTargetSubtype,

    targetId:
      normalizedTargetId,
  }
}

export async function requireCommunicationOperationalTargetExists({
  tx,
  targetType,
  targetSubtype,
  targetId,
}: {
  tx: CommunicationsTransactionClient
  targetType: CommunicationOperationalTargetType
  targetSubtype: string
  targetId: string
}) {
  switch (targetType) {
    case "CASE": {
      const target =
        await tx.case.findUnique({
          where: {
            id:
              targetId,
          },
          select: {
            id:
              true,
          },
        })

      if (!target) {
        throw new Error(
          "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
        )
      }

      return
    }

    case "OPPORTUNITY": {
      const target =
        await tx.opportunity.findUnique({
          where: {
            id:
              targetId,
          },
          select: {
            id:
              true,
          },
        })

      if (!target) {
        throw new Error(
          "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
        )
      }

      return
    }

    case "TRANSACTION_DOSSIER": {
      const target =
        await tx.transactionDossier.findUnique({
          where: {
            id:
              targetId,
          },
          select: {
            id:
              true,
          },
        })

      if (!target) {
        throw new Error(
          "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
        )
      }

      return
    }

    case "TRANSACTION": {
      const target =
        await tx.transaction.findUnique({
          where: {
            id:
              targetId,
          },
          select: {
            id:
              true,
          },
        })

      if (!target) {
        throw new Error(
          "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
        )
      }

      return
    }

    case "TREASURY_GATEWAY_AGGREGATE": {
      const target =
        await tx.treasuryGatewayAggregate.findUnique({
          where: {
            aggregateType_aggregateId: {
              aggregateType:
                targetSubtype,
              aggregateId:
                targetId,
            },
          },
          select: {
            aggregateId:
              true,
          },
        })

      if (!target) {
        throw new Error(
          "COMMUNICATION_OPERATIONAL_TARGET_NOT_FOUND"
        )
      }

      return
    }
  }
}
