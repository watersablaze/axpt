import type { TreasuryExecutionId } from "../shared/identifiers";

import type { TreasuryMoney } from "../shared/money";

/*
 * Compile-time evidence-authority marker.
 *
 * This symbol is intentionally not exported. Ordinary application code
 * therefore cannot structurally construct a
 * VerifiedTreasuryExecutionSettlement from executionId + amount +
 * verifiedAt alone.
 *
 * A trusted rail verifier / translator must deliberately admit the
 * normalized observation across this boundary.
 */
declare const verifiedTreasuryExecutionSettlementBrand: unique symbol;

export type VerifiedTreasuryExecutionSettlement = Readonly<{
  /*
   * Treasury subject identity.
   *
   * The settlement observation concerns an already-governed Treasury
   * Execution. The rail does not create or redefine that Execution.
   */
  executionId: TreasuryExecutionId;

  /*
   * Rail-neutral financial fact.
   *
   * A rail-specific verifier / translator must normalize its native
   * representation into TreasuryMoney before crossing this boundary.
   *
   * Treasury therefore does not know whether the proving rail used
   * cents, base units, wei, satoshis, journal units, or another native
   * representation.
   */
  amount: TreasuryMoney;

  /*
   * Time at which AXPT completed verification of the rail evidence.
   *
   * This is not rail settlement time, value time, posting time,
   * inclusion time, or finality time.
   */
  verifiedAt: Date;

  /*
   * Nominal authority boundary.
   *
   * This property has no runtime representation. Its purpose is to make
   * verified settlement authority explicit at compile time rather than
   * structurally reproducible by arbitrary callers.
   */
  readonly [verifiedTreasuryExecutionSettlementBrand]: true;
}>;
