import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";

import { assertProgramCapitalReceiptTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { ProgramCapitalReceipt } from "./contracts";

import type { VerifyProgramCapitalReceipt } from "./commands";

import type { CapitalReceiptVerifiedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function verifyProgramCapitalReceipt(
  aggregate: ProgramCapitalReceipt,
  command: VerifyProgramCapitalReceipt,
): TreasuryDomainResult<ProgramCapitalReceipt, CapitalReceiptVerifiedPayload> {
  if (command.payload.receiptId !== aggregate.id) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_COMMAND_TARGET_MISMATCH] ${command.payload.receiptId} -> ${aggregate.id}`,
    );
  }

  const to = PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED;

  assertProgramCapitalReceiptTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      verifiedAmount: command.payload.verifiedAmount,

      status: to,

      verifiedAt: command.payload.verifiedAt,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,

      payload: {
        receiptId: aggregate.id,

        verifiedAmount: command.payload.verifiedAmount,

        evidenceIds: command.payload.evidenceIds,

        verifiedAt: command.payload.verifiedAt,
      },

      occurredAt: command.payload.verifiedAt,
    },
  };
}
