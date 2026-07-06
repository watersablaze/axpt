import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { TREASURY_RECONCILIATION_PASS_STATUS } from "./status";

import type { TreasuryCommandContext } from "../shared/commandContext";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TreasuryReconciliationPass } from "./contracts";

import type { TreasuryReconciliationPassFailedPayload } from "./events";

export function failTreasuryReconciliationPass(params: {
  pass: TreasuryReconciliationPass;

  errorCode: string;

  errorMessage: string;

  context: TreasuryCommandContext;
}): TreasuryDomainResult<
  TreasuryReconciliationPass,
  TreasuryReconciliationPassFailedPayload
> {
  const { pass, errorCode, errorMessage, context } = params;

  if (pass.status !== TREASURY_RECONCILIATION_PASS_STATUS.RUNNING) {
    throw new Error(
      `[TREASURY_RECONCILIATION_PASS_FAIL_STATUS_INVALID] ${pass.status}`,
    );
  }

  if (errorCode.trim().length === 0) {
    throw new Error("[TREASURY_RECONCILIATION_PASS_FAILURE_CODE_REQUIRED]");
  }

  if (errorMessage.trim().length === 0) {
    throw new Error("[TREASURY_RECONCILIATION_PASS_FAILURE_MESSAGE_REQUIRED]");
  }

  const failedAt = context.requestedAt;

  return {
    aggregate: {
      ...pass,

      status: TREASURY_RECONCILIATION_PASS_STATUS.FAILED,

      completedAt: failedAt,

      failure: {
        errorCode,

        errorMessage,
      },

      metadata: {
        ...pass.metadata,

        updatedAt: failedAt,

        version: pass.metadata.version + 1,

        lastModifiedByActorId: context.actorId,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_FAILED,

      payload: {
        passId: pass.id,

        errorCode,

        errorMessage,

        failedAt,
      },

      occurredAt: failedAt,
    },
  };
}
