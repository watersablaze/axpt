export const SETTLEMENT_SOURCE_STATUS = {
  ACTIVE: "ACTIVE",

  SUSPENDED: "SUSPENDED",

  RETIRED: "RETIRED",
} as const;

export type SettlementSourceStatus =
  (typeof SETTLEMENT_SOURCE_STATUS)[keyof typeof SETTLEMENT_SOURCE_STATUS];
