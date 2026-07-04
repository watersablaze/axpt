import { TREASURY_INSTRUCTION_STATUS } from "./status";

import { assertTreasuryInstructionTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryInstruction } from "./contracts";

import type { AuthenticateTreasuryInstruction } from "./commands";

import type { TreasuryInstructionAuthenticatedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function authenticateTreasuryInstruction(
  aggregate: TreasuryInstruction,
  command: AuthenticateTreasuryInstruction,
): TreasuryDomainResult<
  TreasuryInstruction,
  TreasuryInstructionAuthenticatedPayload
> {
  if (command.payload.instructionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_INSTRUCTION_COMMAND_TARGET_MISMATCH] ${command.payload.instructionId} -> ${aggregate.id}`,
    );
  }

  const to = TREASURY_INSTRUCTION_STATUS.AUTHENTICATED;

  assertTreasuryInstructionTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      authenticatedAt: now,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_AUTHENTICATED,

      payload: {
        instructionId: aggregate.id,

        method: command.payload.method,

        authenticatedActorId: command.payload.authenticatedActorId,

        authenticatedByActorId: command.context.actorId,

        evidenceArtifactId: command.payload.evidenceArtifactId,

        notes: command.payload.notes,

        authenticatedAt: now,
      },

      occurredAt: now,
    },
  };
}
