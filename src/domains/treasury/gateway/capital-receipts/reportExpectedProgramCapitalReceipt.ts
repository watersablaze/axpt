import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";
import { assertProgramCapitalReceiptTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { ProgramCapitalReceipt } from "./contracts";
import type { ReportExpectedProgramCapitalReceipt } from "./commands";
import type { CapitalReceiptReportedPayload } from "./events";
import type { TreasuryDomainResult } from "../shared/domainResult";

export function reportExpectedProgramCapitalReceipt(
  aggregate: ProgramCapitalReceipt,
  command: ReportExpectedProgramCapitalReceipt,
): TreasuryDomainResult<ProgramCapitalReceipt, CapitalReceiptReportedPayload> {
  if (command.payload.receiptId !== aggregate.id) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_COMMAND_TARGET_MISMATCH] ${command.payload.receiptId} -> ${aggregate.id}`,
    );
  }

  const to = PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED;

  assertProgramCapitalReceiptTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      externalReference: command.payload.externalReference,

      status: to,

      receivedAt: command.payload.receivedAt,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_REPORTED,

      payload: {
        receiptId: aggregate.id,

        programId: aggregate.programId,

        destinationProgramAccountId: aggregate.destinationProgramAccountId,

        declaredAmount: aggregate.declaredAmount,

        receiptMethod: aggregate.receiptMethod,

        externalReference: command.payload.externalReference,

        expectedAt: aggregate.expectedAt,

        receivedAt: command.payload.receivedAt,
      },

      occurredAt: now,
    },
  };
}
