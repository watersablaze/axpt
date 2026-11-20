export const ETHEREUM_MAINNET_SETTLEMENT_POLICY = {
  chainId: 1,
  network: "mainnet",
  minimumConfirmations: 12,
} as const;

export type EthereumMainnetSettlementPolicy =
  typeof ETHEREUM_MAINNET_SETTLEMENT_POLICY;

export function requireEthereumMainnetSettlementConfirmations(
  value: number,
): number {
  if (
    !Number.isInteger(value) ||
    value <
      ETHEREUM_MAINNET_SETTLEMENT_POLICY.minimumConfirmations
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_CONFIRMATION_POLICY_INVALID] minimum=${ETHEREUM_MAINNET_SETTLEMENT_POLICY.minimumConfirmations} received=${value}`,
    );
  }

  return value;
}
