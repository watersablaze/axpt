import type {
  SettlementEndpointId,
  TreasuryExecutionId,
} from "../../../shared/identifiers";

/*
 * Rail-native EVM / ERC-20 settlement evidence.
 *
 * This contract preserves facts observed from the chain.
 *
 * It is deliberately NOT Treasury's rail-neutral
 * VerifiedTreasuryExecutionSettlement and deliberately does not by itself
 * claim that the observed source address was institutionally authorized.
 *
 * Later verification must bind these facts to:
 *
 * - the governed Treasury Execution,
 * - the governed Settlement Endpoint,
 * - governed outbound source authority,
 * - and Treasury finality policy.
 */
export type EvmErc20ExecutionSettlementEvidence = Readonly<{
  /*
   * Treasury subjects this evidence is intended to reconcile.
   *
   * These identifiers do not originate from the blockchain. They bind the
   * observation to already-governed Treasury state.
   */
  executionId: TreasuryExecutionId;

  settlementEndpointId: SettlementEndpointId;

  /*
   * Canonical chain identity.
   */
  chainId: number;

  /*
   * Specific transaction and specific Transfer log identity.
   *
   * transactionHash alone is insufficient because one transaction may emit
   * more than one ERC-20 Transfer event.
   */
  transactionHash: string;

  logIndex: number;

  /*
   * Mined-block identity.
   *
   * blockHash is retained so later verification / reconciliation can detect
   * whether the evidence's original block identity changed through a reorg.
   */
  blockNumber: string;

  blockHash: string;

  /*
   * Receipt success is necessary but is not equivalent to Treasury finality.
   */
  receiptStatus: "success";

  /*
   * Observed ERC-20 Transfer facts.
   */
  tokenContractAddress: string;

  fromAddress: string;

  toAddress: string;

  amountBaseUnits: string;

  /*
   * Finality observation.
   *
   * These preserve both inputs to the depth decision rather than retaining
   * only an opaque boolean such as "final".
   */
  observedHeadBlockNumber: string;

  confirmationDepth: string;

  /*
   * Time AXPT completed this chain observation.
   *
   * This is not transaction time, block time, settlement time, or Treasury
   * confirmation time.
   */
  observedAt: Date;
}>;
