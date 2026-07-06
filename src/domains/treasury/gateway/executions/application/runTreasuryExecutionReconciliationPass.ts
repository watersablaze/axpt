import { randomUUID } from "node:crypto";

import { runDurableTreasuryReconciliationPass } from "../../reconciliation-passes/application/runDurableTreasuryReconciliationPass";

import type { DurableTreasuryReconciliationPassResult } from "../../reconciliation-passes/application/runDurableTreasuryReconciliationPassContracts";

export async function runTreasuryExecutionReconciliationPass(params: {
  limit: number;

  actorId: string;

  authorityGrantId?: string;
}): Promise<DurableTreasuryReconciliationPassResult> {
  const { limit, actorId, authorityGrantId } = params;

  const passId = randomUUID();

  const requestedAt = new Date();

  return runDurableTreasuryReconciliationPass({
    passId,

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
