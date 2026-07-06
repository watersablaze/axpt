import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { TREASURY_TRANSFER_STATUS } from "./status";

import type { CreateTreasuryTransfer } from "./commands";

import type { TreasuryTransfer } from "./contracts";

import type { TreasuryTransferCreatedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TreasuryTransferId } from "../shared/identifiers";

export function createTreasuryTransfer(params: {
  transferId: TreasuryTransferId;

  reference: string;

  command: CreateTreasuryTransfer;
}): TreasuryDomainResult<TreasuryTransfer, TreasuryTransferCreatedPayload> {
  const { transferId, reference, command } = params;

  const { context, payload } = command;

  const now = context.requestedAt;

  const aggregate: TreasuryTransfer = {
    id: transferId,

    reference,

    programId: payload.programId,

    instructionId: payload.instructionId,

    source: payload.source,

    destination: payload.destination,

    requestedAmount: payload.requestedAmount,

    destinationCurrency: payload.destinationCurrency,

    purpose: payload.purpose,

    status: TREASURY_TRANSFER_STATUS.CREATED,

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CREATED,

      payload: {
        transferId,

        programId: payload.programId,

        instructionId: payload.instructionId,

        source: payload.source,

        destination: payload.destination,

        requestedAmount: payload.requestedAmount,

        destinationCurrency: payload.destinationCurrency,

        purpose: payload.purpose,
      },

      occurredAt: now,
    },
  };
}
