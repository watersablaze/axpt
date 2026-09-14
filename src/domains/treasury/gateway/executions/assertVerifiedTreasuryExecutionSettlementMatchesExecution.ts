import type { TreasuryExecution } from "./contracts";

import type { VerifiedTreasuryExecutionSettlement } from "./verifiedSettlementContracts";

export function assertVerifiedTreasuryExecutionSettlementMatchesExecution(params: {
  settlement: VerifiedTreasuryExecutionSettlement;

  execution: TreasuryExecution;
}): void {
  const { settlement, execution } = params;

  if (settlement.executionId !== execution.id) {
    throw new Error(
      `[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_EXECUTION_MISMATCH] ${settlement.executionId} -> ${execution.id}`,
    );
  }

  if (settlement.assetCode.trim().length === 0) {
    throw new Error(
      "[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_ASSET_REQUIRED]",
    );
  }

  if (settlement.amountBaseUnits.trim().length === 0) {
    throw new Error(
      "[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_AMOUNT_REQUIRED]",
    );
  }

  if (Number.isNaN(settlement.verifiedAt.getTime())) {
    throw new Error(
      "[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_VERIFIED_AT_INVALID]",
    );
  }

  /*
   * Treasury already governs the intended value of the Execution.
   *
   * The rail is a witness to external reality, not an authority capable
   * of changing the governed financial instruction.
   */
  if (settlement.assetCode !== execution.amount.currency) {
    throw new Error(
      `[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_ASSET_MISMATCH] ${settlement.assetCode} -> ${execution.amount.currency}`,
    );
  }

  if (settlement.amountBaseUnits !== execution.amount.amount) {
    throw new Error(
      `[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_AMOUNT_MISMATCH] ${settlement.amountBaseUnits} -> ${execution.amount.amount}`,
    );
  }
}
