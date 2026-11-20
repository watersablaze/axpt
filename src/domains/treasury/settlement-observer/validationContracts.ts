import type {
  TreasurySettlementObservationStatus,
} from "./contracts";

export type SettlementObservationValidationInput =
  Readonly<{
    chainId: number;

    tokenContractAddress: `0x${string}`;

    txHash: `0x${string}`;
    logIndex: number;

    blockNumber: bigint;
    blockHash: `0x${string}` | null;

    fromAddress: `0x${string}`;
    toAddress: `0x${string}`;

    amountBaseUnits: bigint;

    currentStatus:
      TreasurySettlementObservationStatus;

    requiredConfirmations: number;
  }>;

export type SettlementObservationObservedTransferLog =
  Readonly<{
    logIndex: number;

    tokenContractAddress: string;

    fromAddress: string;
    toAddress: string;

    amountBaseUnits: bigint;
  }>;

export type SettlementObservationChainReceipt =
  Readonly<{
    status:
      | "success"
      | "reverted";

    blockNumber: bigint;
    blockHash: string;
    blockTimestamp: Date;

    transferLogs:
      readonly SettlementObservationObservedTransferLog[];
  }>;

export type SettlementObservationChainState =
  | Readonly<{
      disposition: "AVAILABLE";

      receipt:
        SettlementObservationChainReceipt | null;

      latestBlockNumber: bigint;

      finalizedBlockNumber: bigint | null;
    }>
  | Readonly<{
      disposition: "UNAVAILABLE";

      errorCode: string;
    }>;

export type SettlementObservationValidationResult =
  Readonly<{
    status:
      TreasurySettlementObservationStatus;

    confirmationCount: number;

    validatedAt: Date | null;
    confirmedAt: Date | null;

    receiptBlockNumber: bigint | null;
    receiptBlockHash: string | null;
    chainTimestamp: Date | null;

    finalizedBlockNumber: bigint | null;

    reason:
      | "RECEIPT_NOT_FOUND"
      | "RECEIPT_FAILED"
      | "BLOCK_IDENTITY_MISMATCH"
      | "TRANSFER_LOG_NOT_FOUND"
      | "TRANSFER_LOG_MISMATCH"
      | "VALIDATED_AWAITING_DEPTH"
      | "VALIDATED_AWAITING_FINALITY"
      | "FINALIZED";
  }>;
