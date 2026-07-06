import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { TREASURY_RECONCILIATION_PASS_STATUS } from "./status";

import type { TreasuryCommandContext } from "../shared/commandContext";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TreasuryReconciliationPass } from "./contracts";

import type { TreasuryReconciliationPassStartedPayload } from "./events";

export function startTreasuryReconciliationPass(
  pass: TreasuryReconciliationPass,

  context: TreasuryCommandContext,
): TreasuryDomainResult<
  TreasuryReconciliationPass,
  TreasuryReconciliationPassStartedPayload
> {
  if (pass.status !== TREASURY_RECONCILIATION_PASS_STATUS.REQUESTED) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_START_STATUS_INVALID] ${pass.status}`,
    );
  }

  const startedAt = context.requestedAt;

  return {
    aggregate: {
      ...pass,

      status: TREASURY_RECONCILIATION_PASS_STATUS.RUNNING,

      startedAt,

      metadata: {
        ...pass.metadata,

        updatedAt: startedAt,

        version: pass.metadata.version + 1,

        lastModifiedByActorId: context.actorId,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_STARTED,

      payload: {
        passId: pass.id,

        startedAt,
      },

      occurredAt: startedAt,
    },
  };
}
