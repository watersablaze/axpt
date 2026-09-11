import {
  normalizeCommunicationOperationalTargetPointer,
  type CommunicationOperationalTargetPointer,
} from "../operational/operationalTargetPointer"

export type CommunicationMessageWorkflowReference =
  CommunicationOperationalTargetPointer

export type CommunicationMessageWorkflowReferenceInput = {
  targetType: string
  targetSubtype: string
  targetId: string
}

export function normalizeCommunicationMessageWorkflowReference(
  value:
    | CommunicationMessageWorkflowReferenceInput
    | null
    | undefined
): CommunicationMessageWorkflowReference | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (
    typeof value !== "object"
  ) {
    throw new Error(
      "COMMUNICATION_MESSAGE_WORKFLOW_REFERENCE_INVALID"
    )
  }

  const {
    targetType,
    targetSubtype,
    targetId,
  } = value

  if (
    typeof targetType !== "string" ||
    typeof targetSubtype !== "string" ||
    typeof targetId !== "string"
  ) {
    throw new Error(
      "COMMUNICATION_MESSAGE_WORKFLOW_REFERENCE_INVALID"
    )
  }

  return normalizeCommunicationOperationalTargetPointer({
    targetType,
    targetSubtype,
    targetId,
  })
}

export function communicationMessageMatchesWorkflowReference({
  message,
  workflowReference,
}: {
  message: {
    workflowTargetType: string | null
    workflowTargetSubtype: string | null
    workflowTargetId: string | null
  }
  workflowReference:
    | CommunicationMessageWorkflowReference
    | null
}) {
  if (!workflowReference) {
    return (
      message.workflowTargetType === null &&
      message.workflowTargetSubtype === null &&
      message.workflowTargetId === null
    )
  }

  return (
    message.workflowTargetType ===
      workflowReference.targetType &&
    message.workflowTargetSubtype ===
      workflowReference.targetSubtype &&
    message.workflowTargetId ===
      workflowReference.targetId
  )
}
