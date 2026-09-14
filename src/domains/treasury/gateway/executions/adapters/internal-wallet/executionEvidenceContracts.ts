import type { TreasuryExecutionId } from "../../../shared/identifiers";

export type InternalWalletExecutionInitiatedEvidence = Readonly<{
  executionId: TreasuryExecutionId;

  treasuryActionId: string;

  treasuryActionStatus: string;

  idempotencyKey: string;

  observedAt: Date;
}>;

export type InternalWalletExecutionSettlementProof = Readonly<{
  executionId: TreasuryExecutionId;

  /*
   * Internal-wallet dispatch / journal provenance.
   *
   * These fields explain how this rail proved settlement. They are not
   * part of Treasury's rail-neutral settlement constitution.
   */
  treasuryActionId: string;

  idempotencyKey: string;

  debitTransactionId: string;

  creditTransactionId: string;

  /*
   * Normalized value established by the internal-wallet verifier.
   */
  assetCode: string;

  amountBaseUnits: string;

  /*
   * Time at which AXPT completed verification of the internal-wallet
   * ledger evidence.
   */
  verifiedAt: Date;
}>;
