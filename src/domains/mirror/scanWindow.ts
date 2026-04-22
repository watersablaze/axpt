export function computeScanWindow(
  lastBlock: bigint,
  latestBlock: bigint,
  maxRange = 10n
) {
  const fromBlock = lastBlock + 1n
  if (fromBlock > latestBlock) return null

  const toBlock = fromBlock + maxRange - 1n
  return {
    fromBlock,
    toBlock: toBlock > latestBlock ? latestBlock : toBlock,
  }
}