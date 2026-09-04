import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { assertPositiveDecimal } from "../shared/decimalAmount";

import type { ProgramCapitalReceipt } from "./contracts";

import type { RegisterExpectedProgramCapitalReceipt } from "./commands";

import type { CapitalReceiptExpectedPayload } from "./events";

import type { ProgramCapitalReceiptId } from "../shared/identifiers";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function registerExpectedProgramCapitalReceipt(params: {
  receiptId: ProgramCapitalReceiptId;

  reference: string;

  command: RegisterExpectedProgramCapitalReceipt;
}): TreasuryDomainResult<ProgramCapitalReceipt, CapitalReceiptExpectedPayload> {
  const { receiptId, reference, command } = params;

  const { context, payload } = command;

  if (receiptId.trim().length === 0) {
    throw new Error("[PROGRAM_CAPITAL_RECEIPT_ID_REQUIRED]");
  }

  if (reference.trim().length === 0) {
    throw new Error("[PROGRAM_CAPITAL_RECEIPT_REFERENCE_REQUIRED]");
  }

  assertPositiveDecimal(payload.declaredAmount.amount);

  const now = context.requestedAt;

  const aggregate: ProgramCapitalReceipt = {
    id: receiptId,

    reference,

    programId: payload.programId,

    destinationProgramAccountId: payload.destinationProgramAccountId,

    receivedFromPartyId: payload.receivedFromPartyId,

    declaredAmount: payload.declaredAmount,

    receiptMethod: payload.receiptMethod,

    status: PROGRAM_CAPITAL_RECEIPT_STATUS.EXPECTED,

    expectedAt: payload.expectedAt,

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
      eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EXPECTED,

      payload: {
        receiptId,

        programId: payload.programId,

        destinationProgramAccountId: payload.destinationProgramAccountId,

        declaredAmount: payload.declaredAmount,

        receiptMethod: payload.receiptMethod,

        expectedAt: payload.expectedAt,
      },

      occurredAt: now,
    },
  };
}
