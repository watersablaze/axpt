import {
  getAddress,
  isAddress,
  parseUnits,
} from "viem";

import {
  TOKENS,
} from "@/lib/treasury/config";

import type {
  DigitalSettlementVerificationMatchResult,
} from "@/domains/instruments/verification-matching";

export type DigitalSettlementVerificationRecognitionEvidence =
  Readonly<{
    transactionHash: string;
    observedAmountUsdt: string;
    observedReceivingAddress: string;
  }>;

export type CanonicalDigitalSettlementVerificationRecognition =
  Readonly<{
    observationId: string;
    instrumentVersionId: string;
    chainId: 1;
    transactionHash: string;
    logIndex: number;
    amountUsdt: string;
    receivingAddress: string;
  }>;

export function assertDigitalSettlementVerificationRecognition(
  params: {
    match:
      DigitalSettlementVerificationMatchResult;

    submitted:
      DigitalSettlementVerificationRecognitionEvidence;
  },
): CanonicalDigitalSettlementVerificationRecognition {
  const {
    match,
    submitted,
  } = params;

  if (
    match.disposition !==
    "MATCHED"
  ) {
    throw new Error(
      `[DSI_VERIFICATION_RECOGNITION_MATCH_REQUIRED] ${match.disposition}`,
    );
  }

  const submittedTransactionHash =
    submitted.transactionHash
      .trim()
      .toLowerCase();

  const canonicalTransactionHash =
    match.candidate.txHash
      .trim()
      .toLowerCase();

  if (
    submittedTransactionHash !==
    canonicalTransactionHash
  ) {
    throw new Error(
      "[DSI_VERIFICATION_RECOGNITION_TRANSACTION_MISMATCH]",
    );
  }

  const submittedReceivingAddress =
    submitted.observedReceivingAddress
      .trim();

  if (
    !isAddress(
      submittedReceivingAddress,
    )
  ) {
    throw new Error(
      "[DSI_VERIFICATION_RECOGNITION_RECEIVING_ADDRESS_MISMATCH]",
    );
  }

  const canonicalReceivingAddress =
    getAddress(
      match.expectation.receivingAddress,
    );

  if (
    getAddress(
      submittedReceivingAddress,
    ) !==
    canonicalReceivingAddress
  ) {
    throw new Error(
      "[DSI_VERIFICATION_RECOGNITION_RECEIVING_ADDRESS_MISMATCH]",
    );
  }

  let submittedAmountBaseUnits:
    bigint;

  try {
    submittedAmountBaseUnits =
      parseUnits(
        submitted.observedAmountUsdt
          .trim(),
        TOKENS.USDT.decimals,
      );
  } catch {
    throw new Error(
      "[DSI_VERIFICATION_RECOGNITION_AMOUNT_INVALID]",
    );
  }

  if (
    submittedAmountBaseUnits !==
    match.expectation.amountBaseUnits
  ) {
    throw new Error(
      "[DSI_VERIFICATION_RECOGNITION_AMOUNT_MISMATCH]",
    );
  }

  return {
    observationId:
      match.candidate.observationId,

    instrumentVersionId:
      match.instrumentVersionId,

    chainId:
      match.expectation.chainId,

    transactionHash:
      canonicalTransactionHash,

    logIndex:
      match.candidate.logIndex,

    amountUsdt:
      match.expectation.amountUsdt,

    receivingAddress:
      canonicalReceivingAddress,
  };
}
