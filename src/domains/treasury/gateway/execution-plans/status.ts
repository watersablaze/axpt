export const TREASURY_EXECUTION_PLAN_STATUS = {
  RECORDED: "RECORDED",
} as const;

export type TreasuryExecutionPlanStatus =
  (typeof TREASURY_EXECUTION_PLAN_STATUS)[keyof typeof TREASURY_EXECUTION_PLAN_STATUS];

export const EXECUTABLE_TRANCHE_STATUS = {
  PLANNED: "PLANNED",
} as const;

export type ExecutableTrancheStatus =
  (typeof EXECUTABLE_TRANCHE_STATUS)[keyof typeof EXECUTABLE_TRANCHE_STATUS];
