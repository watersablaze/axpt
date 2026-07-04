import { TREASURY_ALLOCATION_STATUS } from "./status";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryAllocation } from "./contracts";

import type { CreateTreasuryAllocation } from "./commands";

import type { TreasuryAllocationCreatedPayload } from "./events";

import type { TreasuryAllocationId } from "../shared/identifiers";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function createTreasuryAllocation(params: {
  allocationId: TreasuryAllocationId;

  reference: string;

  command: CreateTreasuryAllocation;
}): TreasuryDomainResult<TreasuryAllocation, TreasuryAllocationCreatedPayload> {
  const { allocationId, reference, command } = params;

  const { context, payload } = command;

  const now = context.requestedAt;

  const aggregate: TreasuryAllocation = {
    id: allocationId,

    reference,

    programId: payload.programId,

    sourceProgramAccountId: payload.sourceProgramAccountId,

    instructionId: payload.instructionId,

    purposeType: payload.purposeType,

    purposeReference: payload.purposeReference,

    amount: payload.amount,

    consumedAmount: {
      amount: "0",

      currency: payload.amount.currency,
    },

    status: TREASURY_ALLOCATION_STATUS.PROPOSED,

    metadata: {
      createdAt: now,

      updatedAt: now,

      createdByActorId: context.actorId,

      lastModifiedByActorId: context.actorId,

      version: 1,
    },
  };

  return {
    aggregate,

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_CREATED,

      payload: {
        allocationId,

        programId: payload.programId,

        sourceProgramAccountId: payload.sourceProgramAccountId,

        instructionId: payload.instructionId,

        purposeType: payload.purposeType,

        purposeReference: payload.purposeReference,

        amount: payload.amount,
      },

      occurredAt: now,
    },
  };
}
