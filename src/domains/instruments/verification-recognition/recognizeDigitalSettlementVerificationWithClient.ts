import {
  getAddress,
  isAddress,
  parseUnits,
} from "viem";

import {
  TOKENS,
} from "@/lib/treasury/config";

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
      !currentSettlement.receivingAddress ||
      !currentSettlement.verificationObservationId ||
      !currentSettlement.verificationInstrumentVersionId
    ) {
      throw new Error(
        "[DSI_VERIFICATION_RECOGNITION_CANONICAL_BINDING_MISSING]",
      );
    }

    const observation =
      await params.client
        .treasurySettlementObservation
        .findUnique({
          where: {
            id:
              currentSettlement.verificationObservationId,
          },
        });

    if (
      !observation ||
      observation.txHash
        .trim()
        .toLowerCase() !==
        submittedTransactionHash
    ) {
      throw new Error(
        "[DSI_VERIFICATION_RECOGNITION_PERSISTED_OBSERVATION_MISMATCH]",
      );
    }

    const submittedReceivingAddress =
      params.submitted
        .observedReceivingAddress
        .trim();

    if (
      !isAddress(
        submittedReceivingAddress,
      )
    ) {
      throw new Error(
        "[DSI_VERIFICATION_INVALID_RECEIVING_ADDRESS]",
      );
    }

    if (
      getAddress(
        submittedReceivingAddress,
      ) !==
      getAddress(
        currentSettlement.receivingAddress,
      )
    ) {
      throw new Error(
        "[DSI_VERIFICATION_RECEIVING_ADDRESS_MISMATCH]",
      );
    }

    let submittedAmountBaseUnits:
      bigint;

    try {
      submittedAmountBaseUnits =
        parseUnits(
          params.submitted
            .observedAmountUsdt
            .trim(),
          TOKENS.USDT.decimals,
        );
    } catch {
      throw new Error(
        "[DSI_VERIFICATION_INVALID_OBSERVED_AMOUNT]",
      );
    }

    const recognizedAmountBaseUnits =
      parseUnits(
        currentSettlement
          .verificationAmountUsdt
          .toString(),
        TOKENS.USDT.decimals,
      );

    if (
      submittedAmountBaseUnits !==
      recognizedAmountBaseUnits
    ) {
      throw new Error(
        `[DSI_VERIFICATION_AMOUNT_MISMATCH] expected=${currentSettlement.verificationAmountUsdt.toString()} actual=${params.submitted.observedAmountUsdt.trim()}`,
      );
    }

    return {
      confirmation: {
        confirmed:
          false as const,

        transactionHash:
          submittedTransactionHash,
      },

      recognition: {
        observationId:
          currentSettlement
            .verificationObservationId,

        instrumentVersionId:
          currentSettlement
            .verificationInstrumentVersionId,

        chainId:
          1 as const,

        transactionHash:
          submittedTransactionHash,

        logIndex:
          observation.logIndex,

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

      verificationObservationId:
        recognition.observationId,

      verificationInstrumentVersionId:
        recognition.instrumentVersionId,

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
