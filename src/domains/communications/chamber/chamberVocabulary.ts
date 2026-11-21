export const COMMUNICATION_CHAMBER_CLASSES = [
  "ADDRESS",
  "NOTICE",
  "PETITION",
  "ACKNOWLEDGMENT",
  "RESPONSE",
  "DECISION_NOTICE",
] as const

export type CommunicationChamberClass =
  (typeof COMMUNICATION_CHAMBER_CLASSES)[number]

export const COMMUNICATION_CHAMBER_ADDRESSEE_TYPES = [
  "CHAMBER",
  "COUNCIL",
  "PARTICIPANT",
  "PARTICIPANTS",
  "OFFICE",
] as const

export type CommunicationChamberAddresseeType =
  (typeof COMMUNICATION_CHAMBER_ADDRESSEE_TYPES)[number]

export function isCommunicationChamberClass(
  value: string
): value is CommunicationChamberClass {
  return (
    COMMUNICATION_CHAMBER_CLASSES as readonly string[]
  ).includes(value)
}

export function isCommunicationChamberAddresseeType(
  value: string
): value is CommunicationChamberAddresseeType {
  return (
    COMMUNICATION_CHAMBER_ADDRESSEE_TYPES as readonly string[]
  ).includes(value)
}
