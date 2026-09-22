import type {
  TransactionClient,
} from "@prisma/client";

import {
  CAPITAL_RECEIPT_METHOD,
} from "../contracts";

import {
  reportProgramCapitalReceiptIdempotentlyWithClient,
  type IdempotentProgramCapitalReceiptReportingResult,
} from "../application/reportProgramCapitalReceiptIdempotentlyWithClient";

import {
  assertDigitalSettlementRecognitionTreasuryIntake,
  deriveDigitalSettlementRecognitionTreasuryReceiptIdentity,
  type DigitalSettlementRecognitionTreasuryIntake,
  type DigitalSettlementRecognitionTreasuryReceiptIdentity,
} from "./digitalSettlementRecognitionIntake";

export type DigitalSettlementRecognitionTreasuryReportingResult =
  Readonly<{
    identity:
      DigitalSettlementRecognitionTreasuryReceiptIdentity;

    report:
      IdempotentProgramCapitalReceiptReportingResult;
  }>;

export async function reportDigitalSettlementRecognitionToTreasuryWithClient(
  params: {
    intake:
      DigitalSettlementRecognitionTreasuryIntake;

    reportedAt:
      Date;

    client:
      TransactionClient;
  },
): Promise<
  DigitalSettlementRecognitionTreasuryReportingResult
> {
  const {
    intake,
    reportedAt,
    client,
  } = params;

  assertDigitalSettlementRecognitionTreasuryIntake(
    intake,
  );

  if (
    Number.isNaN(
      reportedAt.getTime(),
    )
  ) {
    throw new Error(
      "[DSI_TREASURY_REPORT_REPORTED_AT_INVALID]",
    );
  }

  if (
    reportedAt.getTime() <
    intake.source.recognizedAt.getTime()
  ) {
    throw new Error(
      "[DSI_TREASURY_REPORT_BEFORE_RECOGNITION]",
    );
  }

  const identity =
    deriveDigitalSettlementRecognitionTreasuryReceiptIdentity(
      intake,
    );

  const report =
    await reportProgramCapitalReceiptIdempotentlyWithClient({
      request: {
        receiptId:
          identity.receiptId,

        reference:
          identity.reference,

        eventId:
          identity.eventId,

        context: {
          commandId:
            identity.commandId,

          actorId:
            intake.routing.treasuryActorId,

          authorityGrantId:
            intake.routing.authorityGrantId,

          correlationId:
            identity.correlationId,

          causationId:
            identity.causationId,

          requestedAt:
            reportedAt,

          idempotencyKey:
            identity.idempotencyKey,
        },

        payload: {
          programId:
            intake.routing.programId,

          destinationProgramAccountId:
            intake.routing.destinationProgramAccountId,

          declaredAmount:
            intake.source.amount,

          receiptMethod:
            CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER,

          externalReference:
            intake.source.transactionHash
              .trim()
              .toLowerCase(),

          receivedAt:
            intake.source.receivedAt,
        },
      },

      client,
    });

  return {
    identity,
    report,
  };
}
