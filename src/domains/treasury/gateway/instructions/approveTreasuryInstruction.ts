import { TREASURY_INSTRUCTION_STATUS } from "./status";

import { assertTreasuryInstructionTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryInstruction } from "./contracts";

import type { ApproveTreasuryInstruction } from "./commands";

import type { TreasuryInstructionApprovedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function approveTreasuryInstruction(
  aggregate: TreasuryInstruction,
  command: ApproveTreasuryInstruction,
): TreasuryDomainResult<
  TreasuryInstruction,
  TreasuryInstructionApprovedPayload
> {
  if (command.payload.instructionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_INSTRUCTION_COMMAND_TARGET_MISMATCH] ${command.payload.instructionId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.approvalIds.length === 0) {
    throw new Error("[TREASURY_INSTRUCTION_APPROVAL_EVIDENCE_REQUIRED]");
  }

  const to = TREASURY_INSTRUCTION_STATUS.APPROVED;

  assertTreasuryInstructionTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      approvedAt: now,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,

      payload: {
        instructionId: aggregate.id,

        approvalIds: command.payload.approvalIds,

        approvedAt: now,
      },

      occurredAt: now,
    },
  };
}
