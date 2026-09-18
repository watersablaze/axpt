export const SETTLEMENT_ENDPOINT_STATUS = {
  ACTIVE: "ACTIVE",

  SUSPENDED: "SUSPENDED",

  RETIRED: "RETIRED",
} as const;

export type SettlementEndpointStatus =
  (typeof SETTLEMENT_ENDPOINT_STATUS)[keyof typeof SETTLEMENT_ENDPOINT_STATUS];
