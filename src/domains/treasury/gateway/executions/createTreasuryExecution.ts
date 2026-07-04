import { TREASURY_EXECUTION_STATUS } from "./status";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryExecution } from "./contracts";

import type { CreateTreasuryExecution } from "./commands";

import type { TreasuryExecutionCreatedPayload } from "./events";

import type { TreasuryExecutionId } from "../shared/identifiers";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function createTreasuryExecution(params: {
  executionId: TreasuryExecutionId;

  reference: string;

  command: CreateTreasuryExecution;
}): TreasuryDomainResult<TreasuryExecution, TreasuryExecutionCreatedPayload> {
  const { executionId, reference, command } = params;

  const { context, payload } = command;

  const now = context.requestedAt;

  const aggregate: TreasuryExecution = {
    id: executionId,

    reference,

    programId: payload.programId,

    allocationId: payload.allocationId,

    instructionId: payload.instructionId,

    kind: payload.kind,

    beneficiaryProfileId: payload.beneficiaryProfileId,

    settlementEndpointId: payload.settlementEndpointId,

    amount: payload.amount,

    purpose: payload.purpose,

    status: TREASURY_EXECUTION_STATUS.CREATED,

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CREATED,

      payload: {
        executionId,

        programId: payload.programId,

        allocationId: payload.allocationId,

        instructionId: payload.instructionId,

        kind: payload.kind,

        beneficiaryProfileId: payload.beneficiaryProfileId,

        settlementEndpointId: payload.settlementEndpointId,

        amount: payload.amount,

        purpose: payload.purpose,
      },

      occurredAt: now,
    },
  };
}
