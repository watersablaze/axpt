import type { TreasuryExecutionId } from "../shared/identifiers";

export type VerifiedTreasuryExecutionSettlement = Readonly<{
  /*
   * Treasury subject identity.
   *
   * The settlement observation concerns an already-governed Treasury
   * Execution. The rail does not create or redefine that Execution.
   */
  executionId: TreasuryExecutionId;

  /*
   * Normalized financial fact independently established by a
   * rail-specific verifier.
   */
  assetCode: string;

  amountBaseUnits: string;

  /*
   * Time at which AXPT completed verification of the rail evidence.
   *
   * This is deliberately not named settledAt. A rail may later expose
   * its own settlement, value, posting, inclusion, or finality time as
   * rail-specific provenance.
   */
  verifiedAt: Date;
}>;
