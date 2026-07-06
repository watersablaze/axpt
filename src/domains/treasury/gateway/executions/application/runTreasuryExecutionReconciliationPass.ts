import { randomUUID } from "node:crypto";

import { runTreasuryExecutionReconciliationBatch } from "./runTreasuryExecutionReconciliationBatch";

import type { TreasuryExecutionReconciliationBatchResult } from "./runTreasuryExecutionReconciliationBatchContracts";

export async function runTreasuryExecutionReconciliationPass(params: {
  limit: number;

  actorId: string;

  authorityGrantId?: string;
}): Promise<TreasuryExecutionReconciliationBatchResult> {
  const { limit, actorId, authorityGrantId } = params;

  const passId = randomUUID();

  const requestedAt = new Date();

  return runTreasuryExecutionReconciliationBatch({
    limit,

    context: {
      commandId: `treasury-reconciliation-pass:${passId}`,

      actorId,

      authorityGrantId,

      correlationId: `treasury-reconciliation-pass:${passId}`,

      requestedAt,

      idempotencyKey: `treasury-reconciliation-pass:${passId}`,
    },
  });
}
