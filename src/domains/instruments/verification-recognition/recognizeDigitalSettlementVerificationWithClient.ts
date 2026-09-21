import {
  getAddress,
} from "viem";

import {
  confirmDigitalSettlementVerificationWithClient,
  type DigitalSettlementVerificationClient,
} from "@/domains/instruments/commands/confirmDigitalSettlementVerificationWithClient";
import {
  findDigitalSettlementVerificationCandidateWithClient,
  type DigitalSettlementVerificationMatchingClient,
} from "@/domains/instruments/verification-matching";

import {
  assertDigitalSettlementVerificationRecognition,
  type DigitalSettlementVerificationRecognitionEvidence,
} from "./assertDigitalSettlementVerificationRecognition";

export type DigitalSettlementVerificationRecognitionClient =
  DigitalSettlementVerificationClient &
  DigitalSettlementVerificationMatchingClient;

export async function recognizeDigitalSettlementVerificationWithClient(
  params: {
    client:
      DigitalSettlementVerificationRecognitionClient;

    instrumentReference:
      string;

    submitted:
      DigitalSettlementVerificationRecognitionEvidence;

    actorUserId:
      string;

    recognizedAt?:
      Date;
  },
) {
  const instrumentReference =
    params.instrumentReference
      .trim();

  const submittedTransactionHash =
    params.submitted
      .transactionHash
      .trim()
      .toLowerCase();

  /*
   * Preserve idempotency before asking the live matcher for a new
   * candidate. The matcher correctly rejects a DSI that has already
   * left AWAITING_VERIFICATION_TRANSFER, so an exact replay must be
   * recognized here as the already-recorded institutional fact.
   */
  const current =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            instrumentReference,
        },

        include: {
          digitalSettlementInstruction:
            true,
        },
      });

  const currentSettlement =
    current
      ?.digitalSettlementInstruction;

  if (
    currentSettlement
      ?.settlementStatus ===
        "VERIFICATION_CONFIRMED" &&
    currentSettlement
      .verificationTxHash
      ?.trim()
      .toLowerCase() ===
        submittedTransactionHash
  ) {
    if (
      !currentSettlement
        .receivingAddress
    ) {
      throw new Error(
        "[DSI_VERIFICATION_RECOGNITION_RECEIVING_ADDRESS_REQUIRED]",
      );
    }

    const confirmation =
      await confirmDigitalSettlementVerificationWithClient({
        client:
          params.client,

        instrumentReference,

        transactionHash:
          params.submitted.transactionHash,

        observedAmountUsdt:
          params.submitted.observedAmountUsdt,

        observedReceivingAddress:
          params.submitted.observedReceivingAddress,

        actorUserId:
          params.actorUserId,

        verifiedAt:
          params.recognizedAt,
      });

    return {
      confirmation,

      recognition: {
        transactionHash:
          submittedTransactionHash,

        amountUsdt:
          currentSettlement
            .verificationAmountUsdt
            .toString(),

        receivingAddress:
          getAddress(
            currentSettlement
              .receivingAddress,
          ),
      },

      disposition:
        "ALREADY_RECOGNIZED" as const,
    };
  }

  const match =
    await findDigitalSettlementVerificationCandidateWithClient({
      client:
        params.client,

      instrumentReference,
    });

  const recognition =
    assertDigitalSettlementVerificationRecognition({
      match,
      submitted:
        params.submitted,
    });

  const confirmation =
    await confirmDigitalSettlementVerificationWithClient({
      client:
        params.client,

      instrumentReference,

      transactionHash:
        recognition.transactionHash,

      observedAmountUsdt:
        recognition.amountUsdt,

      observedReceivingAddress:
        recognition.receivingAddress,

      actorUserId:
        params.actorUserId,

      verifiedAt:
        params.recognizedAt,
    });

  return {
    confirmation,
    recognition,
    disposition:
      "RECOGNIZED" as const,
  };
}
