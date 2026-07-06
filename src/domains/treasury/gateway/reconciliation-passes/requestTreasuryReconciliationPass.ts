import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { TREASURY_RECONCILIATION_PASS_STATUS } from "./status";

import type { TreasuryCommandContext } from "../shared/commandContext";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TreasuryReconciliationPass } from "./contracts";

import type { TreasuryReconciliationPassRequestedPayload } from "./events";

export function requestTreasuryReconciliationPass(params: {
  passId: string;

  limit: number;

  context: TreasuryCommandContext;
}): TreasuryDomainResult<
  TreasuryReconciliationPass,
  TreasuryReconciliationPassRequestedPayload
> {
  const { passId, limit, context } = params;

  if (passId.trim().length === 0) {
    throw new Error("[TREASURY_RECONCILIATION_PASS_ID_REQUIRED]");
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(`[TREASURY_RECONCILIATION_PASS_LIMIT_INVALID] ${limit}`);
  }

  const requestedAt = context.requestedAt;

  return {
    aggregate: {
      id: passId,

      requestedLimit: limit,

      status: TREASURY_RECONCILIATION_PASS_STATUS.REQUESTED,

      requestedAt,

      metadata: {
        createdAt: requestedAt,

        updatedAt: requestedAt,

        version: 1,

        lastModifiedByActorId: context.actorId,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED,

      payload: {
        passId,

        requestedLimit: limit,

        requestedAt,
      },

      occurredAt: requestedAt,
    },
  };
}
