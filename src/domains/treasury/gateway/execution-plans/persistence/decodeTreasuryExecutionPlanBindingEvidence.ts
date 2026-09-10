import type {
  ExecutableTrancheId,
  TreasuryEventId,
  TreasuryExecutionId,
  TreasuryExecutionPlanId,
} from "../../shared/identifiers";

export type LoadedTreasuryExecutionPlanBindingEvidence = Readonly<{
  executionId: TreasuryExecutionId;

  planId: TreasuryExecutionPlanId;

  trancheId: ExecutableTrancheId;

  eventId: TreasuryEventId;

  aggregateVersion: number;
}>;

type JsonRecord = Record<string, unknown>;

function assertRecord(value: unknown): asserts value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(
      "[TREASURY_GATEWAY_EXECUTION_PLAN_BINDING_EVIDENCE_INVALID]",
    );
  }
}

function requireString(
  record: JsonRecord,
  key: string,
  code: string,
): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

export function decodeTreasuryExecutionPlanBindingEvidence(params: {
  payload: unknown;

  eventId: TreasuryEventId;

  aggregateId: TreasuryExecutionPlanId;

  aggregateVersion: number;

  executionId: TreasuryExecutionId;
}): LoadedTreasuryExecutionPlanBindingEvidence {
  const {
    payload,
    eventId,
    aggregateId,
    aggregateVersion,
    executionId,
  } = params;

  assertRecord(payload);

  const payloadExecutionId = requireString(
    payload,
    "executionId",
    "TREASURY_GATEWAY_EXECUTION_PLAN_BINDING_EXECUTION_ID_INVALID",
  );

  if (payloadExecutionId !== executionId) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_BINDING_EXECUTION_ID_MISMATCH] ${payloadExecutionId} -> ${executionId}`,
    );
  }

  const planId = requireString(
    payload,
    "planId",
    "TREASURY_GATEWAY_EXECUTION_PLAN_BINDING_PLAN_ID_INVALID",
  );

  if (planId !== aggregateId) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_BINDING_PLAN_ID_MISMATCH] ${planId} -> ${aggregateId}`,
    );
  }

  const trancheId = requireString(
    payload,
    "trancheId",
    "TREASURY_GATEWAY_EXECUTION_PLAN_BINDING_TRANCHE_ID_INVALID",
  );

  if (!Number.isInteger(aggregateVersion) || aggregateVersion <= 0) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_PLAN_BINDING_VERSION_INVALID] ${aggregateVersion}`,
    );
  }

  return {
    executionId,

    planId,

    trancheId,

    eventId,

    aggregateVersion,
  };
}
