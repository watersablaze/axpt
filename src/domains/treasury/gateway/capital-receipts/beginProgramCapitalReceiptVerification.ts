import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";

import { assertProgramCapitalReceiptTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { ProgramCapitalReceipt } from "./contracts";

import type { BeginProgramCapitalReceiptVerification } from "./commands";

import type { CapitalReceiptVerificationStartedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function beginProgramCapitalReceiptVerification(
  aggregate: ProgramCapitalReceipt,
  command: BeginProgramCapitalReceiptVerification,
): TreasuryDomainResult<
  ProgramCapitalReceipt,
  CapitalReceiptVerificationStartedPayload
> {
  if (command.payload.receiptId !== aggregate.id) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_COMMAND_TARGET_MISMATCH] ${command.payload.receiptId} -> ${aggregate.id}`,
    );
  }

  const to = PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION;

  assertProgramCapitalReceiptTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFICATION_STARTED,

      payload: {
        receiptId: aggregate.id,
      },

      occurredAt: now,
    },
  };
}
