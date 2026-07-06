export const TREASURY_TRANSFER_STATUS = {
  CREATED: "CREATED",

  AUTHORITY_REVIEW: "AUTHORITY_REVIEW",
} as const;

export type TreasuryTransferStatus =
  (typeof TREASURY_TRANSFER_STATUS)[keyof typeof TREASURY_TRANSFER_STATUS];
