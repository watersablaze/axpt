import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { TREASURY_RECONCILIATION_PASS_STATUS } from "./status";

import type { TreasuryExecutionReconciliationBatchSummary } from "../executions/application/runTreasuryExecutionReconciliationBatchContracts";

import type { TreasuryCommandContext } from "../shared/commandContext";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TreasuryReconciliationPass } from "./contracts";

import type { TreasuryReconciliationPassCompletedPayload } from "./events";

export function completeTreasuryReconciliationPass(params: {
  pass: TreasuryReconciliationPass;

  summary: TreasuryExecutionReconciliationBatchSummary;

  context: TreasuryCommandContext;
}): TreasuryDomainResult<
  TreasuryReconciliationPass,
  TreasuryReconciliationPassCompletedPayload
> {
  const { pass, summary, context } = params;

  if (pass.status !== TREASURY_RECONCILIATION_PASS_STATUS.RUNNING) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_COMPLETE_STATUS_INVALID] ${pass.status}`,
    );
  }

  const completedAt = context.requestedAt;

  return {
    aggregate: {
      ...pass,

      status: TREASURY_RECONCILIATION_PASS_STATUS.COMPLETED,

      completedAt,

      summary,

      failure: undefined,

      metadata: {
        ...pass.metadata,

        updatedAt: completedAt,

        version: pass.metadata.version + 1,

        lastModifiedByActorId: context.actorId,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_COMPLETED,

      payload: {
        passId: pass.id,

        summary,

        completedAt,
      },

      occurredAt: completedAt,
    },
  };
}
