import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";
import { assertProgramCapitalReceiptTransition } from "./assertTransition";
import { TREASURY_EVENT_TYPE } from "../events/eventType";
import type { ProgramCapitalReceipt } from "./contracts";
import type { ReverseRecognizedProgramCapital } from "./commands";
import type { ProgramCapitalRecognitionReversedPayload } from "./events";
import type { TreasuryDomainResult } from "../shared/domainResult";

export function reverseRecognizedProgramCapital(
  aggregate: ProgramCapitalReceipt,
  command: ReverseRecognizedProgramCapital,
): TreasuryDomainResult<
  ProgramCapitalReceipt,
  ProgramCapitalRecognitionReversedPayload
> {
  if (command.payload.receiptId !== aggregate.id) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_COMMAND_TARGET_MISMATCH] ${command.payload.receiptId} -> ${aggregate.id}`,
    );
  }

  const reason = command.payload.reason.trim();

  if (reason.length === 0) {
    throw new Error(
      "[PROGRAM_CAPITAL_RECEIPT_RECOGNITION_REVERSAL_REASON_REQUIRED]",
    );
  }

  const to = PROGRAM_CAPITAL_RECEIPT_STATUS.REVERSED;

  assertProgramCapitalReceiptTransition(aggregate.status, to);

  if (!aggregate.recognizedAmount || !aggregate.recognizedAt) {
    throw new Error(
      "[PROGRAM_CAPITAL_RECEIPT_RECOGNITION_REQUIRED_FOR_REVERSAL]",
    );
  }

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
      eventType: TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNITION_REVERSED,

      payload: {
        receiptId: aggregate.id,

        reason,
      },

      occurredAt: now,
    },
  };
}
