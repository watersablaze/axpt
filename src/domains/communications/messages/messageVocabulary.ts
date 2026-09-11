export const COMMUNICATION_MESSAGE_KINDS = [
  "TEXT",
  "SYSTEM",
  "NOTICE",
  "REQUEST",
  "DECISION",
  "APPROVAL_REQUEST",
  "STATUS_UPDATE",
  "DOCUMENT_REFERENCE",
] as const

export type CommunicationMessageKind =
  (typeof COMMUNICATION_MESSAGE_KINDS)[number]

/*
 * SYSTEM is reserved for server-originated
 * communication. Human message submission
 * cannot impersonate the system.
 */
export const COMMUNICATION_SENDABLE_MESSAGE_KINDS = [
  "TEXT",
  "NOTICE",
  "REQUEST",
  "DECISION",
  "APPROVAL_REQUEST",
  "STATUS_UPDATE",
  "DOCUMENT_REFERENCE",
] as const satisfies readonly CommunicationMessageKind[]

export type CommunicationSendableMessageKind =
  (typeof COMMUNICATION_SENDABLE_MESSAGE_KINDS)[number]

export function isCommunicationSendableMessageKind(
  value: unknown
): value is CommunicationSendableMessageKind {
  return (
    typeof value === "string" &&
    (
      COMMUNICATION_SENDABLE_MESSAGE_KINDS as
        readonly string[]
    ).includes(value)
  )
}
