import type { TreasuryExecutionId } from "../../../shared/identifiers";

export type InternalWalletExecutionInitiatedEvidence = Readonly<{
  executionId: TreasuryExecutionId;

  treasuryActionId: string;

  treasuryActionStatus: string;

  idempotencyKey: string;

  observedAt: Date;
}>;

export type InternalWalletExecutionConfirmedEvidence = Readonly<{
  executionId: TreasuryExecutionId;

  treasuryActionId: string;

  idempotencyKey: string;

  debitTransactionId: string;

  creditTransactionId: string;

  assetCode: string;

  amountBaseUnits: string;

  confirmedAt: Date;
}>;
