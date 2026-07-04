import type { LoadedTreasuryExecutionAuthorizationEvidence } from "./contracts";

type JsonRecord = Record<string, unknown>;

function assertRecord(value: unknown): asserts value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(
      "[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_EVIDENCE_INVALID]",
    );
  }
}

export function decodeTreasuryExecutionAuthorizationEvidence(params: {
  payload: unknown;

  eventId: string;

  aggregateVersion: number;

  executionId: string;
}): LoadedTreasuryExecutionAuthorizationEvidence {
  const { payload, eventId, aggregateVersion, executionId } = params;

  assertRecord(payload);

  const payloadExecutionId = payload.executionId;

  if (
    typeof payloadExecutionId !== "string" ||
    payloadExecutionId !== executionId
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_EVIDENCE_ID_MISMATCH] ${String(payloadExecutionId)} -> ${executionId}`,
    );
  }

  const approvalIds = payload.approvalIds;

  if (
    !Array.isArray(approvalIds) ||
    approvalIds.length === 0 ||
    approvalIds.some(
      (approvalId) =>
        typeof approvalId !== "string" || approvalId.trim().length === 0,
    )
  ) {
    throw new Error(
      "[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_APPROVAL_EVIDENCE_INVALID]",
    );
  }

  const authorizedAtValue = payload.authorizedAt;

  if (typeof authorizedAtValue !== "string") {
    throw new Error(
      "[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_TIMESTAMP_INVALID]",
    );
  }

  const authorizedAt = new Date(authorizedAtValue);

  if (Number.isNaN(authorizedAt.getTime())) {
    throw new Error(
      "[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_TIMESTAMP_INVALID]",
    );
  }

  return {
    approvalIds: approvalIds as readonly string[],

    authorizedAt,

    eventId,

    aggregateVersion,
  };
}
