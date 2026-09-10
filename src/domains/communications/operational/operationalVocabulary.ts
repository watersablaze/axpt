import {
  TREASURY_AGGREGATE_TYPE,
  type TreasuryAggregateType,
} from "@/domains/treasury/gateway/events/aggregateTypes"

export const COMMUNICATION_OPERATIONAL_ROOM_CLASSES = [
  "GENERAL_OPERATIONS",
  "TRANSACTION",
  "TREASURY",
  "DOSSIER",
  "CASE",
  "OPPORTUNITY",
] as const

export type CommunicationOperationalRoomClass =
  (typeof COMMUNICATION_OPERATIONAL_ROOM_CLASSES)[number]

export const COMMUNICATION_OPERATIONAL_TARGET_TYPES = [
  "CASE",
  "OPPORTUNITY",
  "TRANSACTION_DOSSIER",
  "TRANSACTION",
  "TREASURY_GATEWAY_AGGREGATE",
] as const

export type CommunicationOperationalTargetType =
  (typeof COMMUNICATION_OPERATIONAL_TARGET_TYPES)[number]

export const COMMUNICATION_OPERATIONAL_TREASURY_SUBTYPES =
  Object.values(
    TREASURY_AGGREGATE_TYPE
  ) as TreasuryAggregateType[]
