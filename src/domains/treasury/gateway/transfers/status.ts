export const TREASURY_TRANSFER_STATUS = {
  CREATED: "CREATED",
} as const;

export type TreasuryTransferStatus =
  (typeof TREASURY_TRANSFER_STATUS)[keyof typeof TREASURY_TRANSFER_STATUS];
