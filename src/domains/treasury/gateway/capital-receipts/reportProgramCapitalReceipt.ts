import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { ProgramCapitalReceipt } from "./contracts";

import type { ReportProgramCapitalReceipt } from "./commands";

import type { CapitalReceiptReportedPayload } from "./events";

import type { ProgramCapitalReceiptId } from "../shared/identifiers";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function reportProgramCapitalReceipt(params: {
  receiptId: ProgramCapitalReceiptId;

  reference: string;

  command: ReportProgramCapitalReceipt;
}): TreasuryDomainResult<ProgramCapitalReceipt, CapitalReceiptReportedPayload> {
  const { receiptId, reference, command } = params;

  const { context, payload } = command;

  const now = context.requestedAt;

  const aggregate: ProgramCapitalReceipt = {
    id: receiptId,

    reference,

    programId: payload.programId,

    destinationProgramAccountId: payload.destinationProgramAccountId,

    receivedFromPartyId: payload.receivedFromPartyId,

    declaredAmount: payload.declaredAmount,

    receiptMethod: payload.receiptMethod,

    externalReference: payload.externalReference,

    status: PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,

    expectedAt: payload.expectedAt,

    receivedAt: payload.receivedAt,

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
      eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_REPORTED,

      payload: {
        receiptId,

        programId: payload.programId,

        destinationProgramAccountId: payload.destinationProgramAccountId,

        declaredAmount: payload.declaredAmount,

        receiptMethod: payload.receiptMethod,

        externalReference: payload.externalReference,

        expectedAt: payload.expectedAt,

        receivedAt: payload.receivedAt,
      },

      occurredAt: now,
    },
  };
}
