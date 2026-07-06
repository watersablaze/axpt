import {
  addDecimals,
  assertPositiveDecimal,
  compareDecimals,
} from "../shared/decimalAmount";

import type { TreasuryMoney } from "../shared/money";

import type { RecordTreasuryExecutionPlanTranche } from "./commands";

export function validateTreasuryExecutionPlan(params: {
  plannedAmount: TreasuryMoney;

  executableNow: TreasuryMoney;

  tranches: readonly RecordTreasuryExecutionPlanTranche[];
}): void {
  const { plannedAmount, executableNow, tranches } = params;

  if (tranches.length === 0) {
    throw new Error("[TREASURY_EXECUTION_PLAN_TRANCHE_REQUIRED]");
  }

  assertPositiveDecimal(plannedAmount.amount);

  if (plannedAmount.currency !== executableNow.currency) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_CAPACITY_CURRENCY_MISMATCH] ${plannedAmount.currency} -> ${executableNow.currency}`,
    );
  }

  if (compareDecimals(plannedAmount.amount, executableNow.amount) > 0) {
    throw new Error("[TREASURY_EXECUTION_PLAN_EXCEEDS_EXECUTABLE_CAPACITY]");
  }

  const sequences = new Set<number>();

  let trancheTotal = "0";

  for (const tranche of tranches) {
    if (sequences.has(tranche.sequence)) {
      throw new Error(
        `[TREASURY_EXECUTION_PLAN_DUPLICATE_TRANCHE_SEQUENCE] ${tranche.sequence}`,
      );
    }

    sequences.add(tranche.sequence);

    assertPositiveDecimal(tranche.amount.amount);

    if (tranche.amount.currency !== plannedAmount.currency) {
      throw new Error(
        `[TREASURY_EXECUTION_PLAN_TRANCHE_CURRENCY_MISMATCH] ${tranche.amount.currency} -> ${plannedAmount.currency}`,
      );
    }

    trancheTotal = addDecimals(trancheTotal, tranche.amount.amount);
  }

  if (compareDecimals(trancheTotal, plannedAmount.amount) !== 0) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_TRANCHE_TOTAL_MISMATCH] ${trancheTotal} -> ${plannedAmount.amount}`,
    );
  }
}
