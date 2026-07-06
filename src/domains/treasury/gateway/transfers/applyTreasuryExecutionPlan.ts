import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryExecutionPlan } from "../execution-plans/contracts";

import { assertTreasuryTransferTransition } from "./assertTransition";

import { TREASURY_TRANSFER_STATUS } from "./status";

import type { ApplyTreasuryExecutionPlan } from "./commands";

import type { TreasuryTransfer } from "./contracts";

import type { TreasuryTransferPlannedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function applyTreasuryExecutionPlan(
  aggregate: TreasuryTransfer,

  plan: TreasuryExecutionPlan,

  command: ApplyTreasuryExecutionPlan,
): TreasuryDomainResult<TreasuryTransfer, TreasuryTransferPlannedPayload> {
  if (command.payload.transferId !== aggregate.id) {
    throw new Error(
      `[TREASURY_TRANSFER_COMMAND_TARGET_MISMATCH] ${command.payload.transferId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.planId !== plan.id) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_COMMAND_TARGET_MISMATCH] ${command.payload.planId} -> ${plan.id}`,
    );
  }

  if (plan.transferId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH] ${plan.transferId} -> ${aggregate.id}`,
    );
  }

  const to = TREASURY_TRANSFER_STATUS.PLANNED;

  assertTreasuryTransferTransition(
    aggregate.status,

    to,
  );

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,

      payload: {
        transferId: aggregate.id,

        planId: plan.id,
      },

      occurredAt: now,
    },
  };
}
