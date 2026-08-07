import type { LoadedTreasuryTransferPlanningEvidence } from "./contracts";

type JsonRecord = Record<string, unknown>;

function assertRecord(value: unknown): asserts value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("[TREASURY_GATEWAY_TRANSFER_PLANNING_EVIDENCE_INVALID]");
  }
}

function requireString(record: JsonRecord, key: string, code: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

export function decodeTreasuryTransferPlanningEvidence(params: {
  payload: unknown;

  eventId: string;

  aggregateVersion: number;

  transferId: string;
}): LoadedTreasuryTransferPlanningEvidence {
  const { payload, eventId, aggregateVersion, transferId } = params;

  assertRecord(payload);

  const payloadTransferId = requireString(
    payload,
    "transferId",
    "TREASURY_GATEWAY_TRANSFER_PLANNING_EVIDENCE_INVALID",
  );

  if (payloadTransferId !== transferId) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_PLANNING_EVIDENCE_ID_MISMATCH] ${payloadTransferId} -> ${transferId}`,
    );
  }

  const planId = requireString(
    payload,
    "planId",
    "TREASURY_GATEWAY_TRANSFER_PLANNING_PLAN_ID_INVALID",
  );

  if (!Number.isInteger(aggregateVersion) || aggregateVersion <= 0) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_PLANNING_VERSION_INVALID] ${aggregateVersion}`,
    );
  }

  return {
    transferId,

    planId,

    eventId,

    aggregateVersion,
  };
}
