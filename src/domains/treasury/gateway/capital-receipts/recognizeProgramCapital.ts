import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";
import { assertProgramCapitalReceiptTransition } from "./assertTransition";
import { TREASURY_EVENT_TYPE } from "../events/eventType";
import {
  assertPositiveDecimal,
  compareDecimals,
} from "../shared/decimalAmount";
import type { ProgramCapitalReceipt } from "./contracts";
import type { RecognizeProgramCapital } from "./commands";
import type { ProgramCapitalRecognizedPayload } from "./events";
import type { TreasuryDomainResult } from "../shared/domainResult";

export function recognizeProgramCapital(
  aggregate: ProgramCapitalReceipt,
  command: RecognizeProgramCapital,
): TreasuryDomainResult<
  ProgramCapitalReceipt,
  ProgramCapitalRecognizedPayload
> {
  if (command.payload.receiptId !== aggregate.id) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_COMMAND_TARGET_MISMATCH] ${command.payload.receiptId} -> ${aggregate.id}`,
    );
  }

  const to = PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED;

  assertProgramCapitalReceiptTransition(aggregate.status, to);

  if (!aggregate.verifiedAmount) {
    throw new Error(
      "[PROGRAM_CAPITAL_RECEIPT_VERIFIED_AMOUNT_REQUIRED_FOR_RECOGNITION]",
    );
  }

  assertPositiveDecimal(command.payload.recognizedAmount.amount);

  if (
    command.payload.recognizedAmount.currency !==
    aggregate.verifiedAmount.currency
  ) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_RECOGNIZED_AMOUNT_CURRENCY_MISMATCH] ${command.payload.recognizedAmount.currency} -> ${aggregate.verifiedAmount.currency}`,
    );
  }

  if (
    compareDecimals(
      command.payload.recognizedAmount.amount,
      aggregate.verifiedAmount.amount,
    ) > 0
  ) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_RECOGNIZED_AMOUNT_EXCEEDS_VERIFIED] ${command.payload.recognizedAmount.amount} -> ${aggregate.verifiedAmount.amount}`,
    );
  }

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      recognizedAmount: command.payload.recognizedAmount,

      status: to,

      recognizedAt: now,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.PROGRAM_CAPITAL_RECOGNIZED,

      payload: {
        receiptId: aggregate.id,

        programId: aggregate.programId,

        destinationProgramAccountId: aggregate.destinationProgramAccountId,

        recognizedAmount: command.payload.recognizedAmount,

        recognitionMemo: command.payload.recognitionMemo,
      },

      occurredAt: now,
    },
  };
}
