import type { TransactionClient } from "@prisma/client";

import { TREASURY_ACTION_STATUS } from "../../../../stateMachine";

import type { TreasuryExecutionId } from "../../../shared/identifiers";

import type { InternalWalletExecutionInitiatedEvidence } from "./executionEvidenceContracts";

import { loadInternalWalletTreasuryActionWithClient } from "./loadInternalWalletTreasuryActionWithClient";

const INITIATED_ACTION_STATUSES = new Set<string>([
  TREASURY_ACTION_STATUS.EXECUTING,
  TREASURY_ACTION_STATUS.EXECUTED,
  TREASURY_ACTION_STATUS.FAILED_RETRYABLE,
  TREASURY_ACTION_STATUS.FAILED_TERMINAL,
]);

export async function loadInternalWalletExecutionInitiatedEvidenceWithClient(params: {
  executionId: TreasuryExecutionId;

  observedAt: Date;

  client: TransactionClient;
}): Promise<InternalWalletExecutionInitiatedEvidence | null> {
  const { executionId, observedAt, client } = params;

  const action = await loadInternalWalletTreasuryActionWithClient({
    executionId,

    client,
  });

  if (!action) {
    return null;
  }

  if (!INITIATED_ACTION_STATUSES.has(action.status)) {
    return null;
  }

  return {
    executionId,

    treasuryActionId: action.id,

    treasuryActionStatus: action.status,

    idempotencyKey: action.idempotencyKey,

    observedAt,
  };
}
