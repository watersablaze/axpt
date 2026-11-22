import {
  TREASURY_SETTLEMENT_OBSERVATION_STATUS,
} from "./contracts";

import type {
  SettlementObservationChainReceipt,
  SettlementObservationValidationInput,
  SettlementObservationValidationResult,
} from "./validationContracts";

function normalize(
  value: string,
): string {
  return value.toLowerCase();
}

export function classifySettlementObservationValidation(params: {
  observation:
    SettlementObservationValidationInput;

  receipt:
    SettlementObservationChainReceipt | null;

  latestBlockNumber: bigint;

  finalizedBlockNumber: bigint | null;

  now: Date;
}): SettlementObservationValidationResult {
  const {
    observation,
    receipt,
    latestBlockNumber,
    finalizedBlockNumber,
    now,
  } = params;

  if (!receipt) {
    return {
      status:
        TREASURY_SETTLEMENT_OBSERVATION_STATUS.ORPHANED,

      confirmationCount: 0,

      validatedAt: null,
      confirmedAt: null,

      receiptBlockNumber: null,
      receiptBlockHash: null,
      chainTimestamp: null,

      finalizedBlockNumber,

      reason:
        "RECEIPT_NOT_FOUND",
    };
  }

  if (
    receipt.status ===
    "reverted"
  ) {
    return {
      status:
        TREASURY_SETTLEMENT_OBSERVATION_STATUS.FAILED,

      confirmationCount: 0,

      validatedAt: now,
      confirmedAt: null,

      receiptBlockNumber:
        receipt.blockNumber,

      receiptBlockHash:
        receipt.blockHash,
      chainTimestamp: null,

      finalizedBlockNumber,

      reason:
        "RECEIPT_FAILED",
    };
  }

  const expectedBlockHash =
    observation.blockHash === null
      ? null
      : normalize(
          observation.blockHash,
        );

  const receiptBlockHash =
    normalize(
      receipt.blockHash,
    );

  if (
    receipt.blockNumber !==
      observation.blockNumber ||
    (
      expectedBlockHash !== null &&
      receiptBlockHash !==
        expectedBlockHash
    )
  ) {
    return {
      status:
        TREASURY_SETTLEMENT_OBSERVATION_STATUS.ORPHANED,

      confirmationCount: 0,

      validatedAt: null,
      confirmedAt: null,

      receiptBlockNumber:
        receipt.blockNumber,

      receiptBlockHash,
      chainTimestamp: null,

      finalizedBlockNumber,

      reason:
        "BLOCK_IDENTITY_MISMATCH",
    };
  }

  const log =
    receipt.transferLogs.find(
      (candidate) =>
        candidate.logIndex ===
        observation.logIndex,
    );

  if (!log) {
    return {
      status:
        TREASURY_SETTLEMENT_OBSERVATION_STATUS.ORPHANED,

      confirmationCount: 0,

      validatedAt: null,
      confirmedAt: null,

      receiptBlockNumber:
        receipt.blockNumber,

      receiptBlockHash,
      chainTimestamp: null,

      finalizedBlockNumber,

      reason:
        "TRANSFER_LOG_NOT_FOUND",
    };
  }

  const logMatches =
    normalize(
      log.tokenContractAddress,
    ) ===
      normalize(
        observation.tokenContractAddress,
      ) &&
    normalize(
      log.fromAddress,
    ) ===
      normalize(
        observation.fromAddress,
      ) &&
    normalize(
      log.toAddress,
    ) ===
      normalize(
        observation.toAddress,
      ) &&
    log.amountBaseUnits ===
      observation.amountBaseUnits;

  if (!logMatches) {
    return {
      status:
        TREASURY_SETTLEMENT_OBSERVATION_STATUS.ORPHANED,

      confirmationCount: 0,

      validatedAt: null,
      confirmedAt: null,

      receiptBlockNumber:
        receipt.blockNumber,

      receiptBlockHash,
      chainTimestamp: null,

      finalizedBlockNumber,

      reason:
        "TRANSFER_LOG_MISMATCH",
    };
  }

  const rawConfirmations =
    latestBlockNumber >=
    receipt.blockNumber
      ? latestBlockNumber -
          receipt.blockNumber +
        1n
      : 0n;

  const confirmationCount =
    rawConfirmations >
    BigInt(
      Number.MAX_SAFE_INTEGER,
    )
      ? Number.MAX_SAFE_INTEGER
      : Number(
          rawConfirmations,
        );

  if (
    confirmationCount <
    observation.requiredConfirmations
  ) {
    return {
      status:
        TREASURY_SETTLEMENT_OBSERVATION_STATUS.CONFIRMING,

      confirmationCount,

      validatedAt: now,
      confirmedAt: null,

      receiptBlockNumber:
        receipt.blockNumber,

      receiptBlockHash,
      chainTimestamp:
        receipt.blockTimestamp,

      finalizedBlockNumber,

      reason:
        "VALIDATED_AWAITING_DEPTH",
    };
  }

  if (
    finalizedBlockNumber === null ||
    receipt.blockNumber >
      finalizedBlockNumber
  ) {
    return {
      status:
        TREASURY_SETTLEMENT_OBSERVATION_STATUS.CONFIRMING,

      confirmationCount,

      validatedAt: now,
      confirmedAt: null,

      receiptBlockNumber:
        receipt.blockNumber,

      receiptBlockHash,
      chainTimestamp:
        receipt.blockTimestamp,

      finalizedBlockNumber,

      reason:
        "VALIDATED_AWAITING_FINALITY",
    };
  }

  return {
    status:
      TREASURY_SETTLEMENT_OBSERVATION_STATUS.CONFIRMED,

    confirmationCount,

    validatedAt:
      now,

    confirmedAt:
      now,

    receiptBlockNumber:
      receipt.blockNumber,

    receiptBlockHash,
    chainTimestamp:
      receipt.blockTimestamp,

    finalizedBlockNumber,

    reason:
      "FINALIZED",
  };
}
