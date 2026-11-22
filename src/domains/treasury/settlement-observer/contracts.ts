export const TREASURY_SETTLEMENT_OBSERVATION_DIRECTION = {
  IN: "IN",
  OUT: "OUT",
} as const;

export type TreasurySettlementObservationDirection =
  (typeof TREASURY_SETTLEMENT_OBSERVATION_DIRECTION)[keyof typeof TREASURY_SETTLEMENT_OBSERVATION_DIRECTION];

export const TREASURY_SETTLEMENT_OBSERVATION_STATUS = {
  DETECTED: "DETECTED",
  VALIDATED: "VALIDATED",
  CONFIRMING: "CONFIRMING",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
  ORPHANED: "ORPHANED",
} as const;

export type TreasurySettlementObservationStatus =
  (typeof TREASURY_SETTLEMENT_OBSERVATION_STATUS)[keyof typeof TREASURY_SETTLEMENT_OBSERVATION_STATUS];

export type SettlementObservationIdentity = Readonly<{
  chainId: number;
  txHash: string;
  logIndex: number;
}>;

export type SettlementObservationRecord = Readonly<{
  id: string;

  chainId: number;
  network: string;

  tokenContractAddress: string;

  txHash: string;
  logIndex: number;

  blockNumber: bigint;
  blockHash: string | null;

  fromAddress: string;
  toAddress: string;

  amountBaseUnits: string;

  direction: TreasurySettlementObservationDirection;
  status: TreasurySettlementObservationStatus;

  detectedAt: Date;
  chainTimestamp: Date | null;
  validatedAt: Date | null;
  confirmedAt: Date | null;

  confirmationCount: number;
  requiredConfirmations: number;
}>;

export type SettlementObservationCursorKey = Readonly<{
  chainId: number;
  tokenContractAddress: string;
  watchedAddress: string;
}>;

export type SettlementObservationCursorRecord = Readonly<{
  id: string;

  chainId: number;
  network: string;

  tokenContractAddress: string;
  watchedAddress: string;

  lastScannedBlock: bigint;
  lastScannedBlockHash: string | null;

  updatedAt: Date;
}>;
