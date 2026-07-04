import { TREASURY_ALLOCATION_STATUS } from "./status";

import { assertTreasuryAllocationTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryAllocation } from "./contracts";

import type { ApproveTreasuryAllocation } from "./commands";

import type { TreasuryAllocationApprovedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function approveTreasuryAllocation(
  aggregate: TreasuryAllocation,
  command: ApproveTreasuryAllocation,
): TreasuryDomainResult<TreasuryAllocation, TreasuryAllocationApprovedPayload> {
  if (command.payload.allocationId !== aggregate.id) {
    throw new Error(
      `[TREASURY_ALLOCATION_COMMAND_TARGET_MISMATCH] ${command.payload.allocationId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.approvalIds.length === 0) {
    throw new Error("[TREASURY_ALLOCATION_APPROVAL_EVIDENCE_REQUIRED]");
  }

  const to = TREASURY_ALLOCATION_STATUS.APPROVED;

  assertTreasuryAllocationTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      approvedByActorId: command.context.actorId,

      approvedAt: now,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_APPROVED,

      payload: {
        allocationId: aggregate.id,

        approvalIds: command.payload.approvalIds,

        approvedAt: now,
      },

      occurredAt: now,
    },
  };
}
