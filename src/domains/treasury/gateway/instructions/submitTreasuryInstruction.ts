import { TREASURY_INSTRUCTION_STATUS } from "./status";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryInstruction } from "./contracts";

import type { SubmitTreasuryInstruction } from "./commands";

import type { TreasuryInstructionSubmittedPayload } from "./events";

import type { TreasuryInstructionId } from "../shared/identifiers";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function submitTreasuryInstruction(params: {
  instructionId: TreasuryInstructionId;

  reference: string;

  command: SubmitTreasuryInstruction;
}): TreasuryDomainResult<
  TreasuryInstruction,
  TreasuryInstructionSubmittedPayload
> {
  const { instructionId, reference, command } = params;

  const { context, payload } = command;

  const now = context.requestedAt;

  const aggregate: TreasuryInstruction = {
    id: instructionId,

    reference,

    programId: payload.programId,

    instructionType: payload.instructionType,

    submittedByActorId: context.actorId,

    requestedAmount: payload.requestedAmount,

    purpose: payload.purpose,

    effectiveDate: payload.effectiveDate,

    expiryDate: payload.expiryDate,

    status: TREASURY_INSTRUCTION_STATUS.SUBMITTED,

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_SUBMITTED,

      payload: {
        instructionId,

        programId: payload.programId,

        instructionType: payload.instructionType,

        submittedByActorId: context.actorId,

        requestedAmount: payload.requestedAmount,

        purpose: payload.purpose,

        effectiveDate: payload.effectiveDate,

        expiryDate: payload.expiryDate,
      },

      occurredAt: now,
    },
  };
}
