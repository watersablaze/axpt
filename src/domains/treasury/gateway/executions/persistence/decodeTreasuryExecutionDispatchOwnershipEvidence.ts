import { TREASURY_EXECUTION_ADAPTER_KIND } from "../routing/contracts";

import type { TreasuryExecutionAdapterKind } from "../routing/contracts";

import type { LoadedTreasuryExecutionDispatchOwnershipEvidence } from "./contracts";

type JsonRecord = Record<string, unknown>;

function assertRecord(value: unknown): asserts value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(
      "[TREASURY_GATEWAY_EXECUTION_DISPATCH_OWNERSHIP_EVIDENCE_INVALID]",
    );
  }
}

function requireString(record: JsonRecord, key: string, code: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

export function decodeTreasuryExecutionDispatchOwnershipEvidence(params: {
  payload: unknown;

  eventId: string;

  aggregateVersion: number;

  executionId: string;
}): LoadedTreasuryExecutionDispatchOwnershipEvidence {
  const { payload, eventId, aggregateVersion, executionId } = params;

  assertRecord(payload);

  const payloadExecutionId = requireString(
    payload,
    "executionId",
    "TREASURY_GATEWAY_EXECUTION_DISPATCH_OWNERSHIP_EVIDENCE_INVALID",
  );

  if (payloadExecutionId !== executionId) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_DISPATCH_OWNERSHIP_ID_MISMATCH] ${payloadExecutionId} -> ${executionId}`,
    );
  }

  const adapterKind = requireString(
    payload,
    "adapterKind",
    "TREASURY_GATEWAY_EXECUTION_DISPATCH_ADAPTER_KIND_INVALID",
  );

  if (
    !Object.values(TREASURY_EXECUTION_ADAPTER_KIND).includes(
      adapterKind as TreasuryExecutionAdapterKind,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_DISPATCH_ADAPTER_KIND_INVALID] ${adapterKind}`,
    );
  }

  const queuedAtValue = requireString(
    payload,
    "queuedAt",
    "TREASURY_GATEWAY_EXECUTION_DISPATCH_QUEUED_AT_INVALID",
  );

  const queuedAt = new Date(queuedAtValue);

  if (Number.isNaN(queuedAt.getTime())) {
    throw new Error("[TREASURY_GATEWAY_EXECUTION_DISPATCH_QUEUED_AT_INVALID]");
  }

  return {
    handoffId: requireString(
      payload,
      "handoffId",
      "TREASURY_GATEWAY_EXECUTION_DISPATCH_HANDOFF_ID_INVALID",
    ),

    adapterKind: adapterKind as TreasuryExecutionAdapterKind,

    settlementEndpointId: requireString(
      payload,
      "settlementEndpointId",
      "TREASURY_GATEWAY_EXECUTION_DISPATCH_SETTLEMENT_ENDPOINT_INVALID",
    ),

    treasuryActionId: requireString(
      payload,
      "treasuryActionId",
      "TREASURY_GATEWAY_EXECUTION_DISPATCH_ACTION_ID_INVALID",
    ),

    treasuryQueueJobId: requireString(
      payload,
      "treasuryQueueJobId",
      "TREASURY_GATEWAY_EXECUTION_DISPATCH_QUEUE_ID_INVALID",
    ),

    queuedAt,

    eventId,

    aggregateVersion,
  };
}
