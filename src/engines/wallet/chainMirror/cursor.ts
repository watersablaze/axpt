export type ChainCursor = {
  chain: string
  contract: string
  lastBlock: bigint
}

let memoryCursor: ChainCursor | null = null

export function loadCursor(chain: string, contract: string): ChainCursor {
  if (!memoryCursor) {
    memoryCursor = {
      chain,
      contract,
      lastBlock: 0n, // bootstrap anchor
    }
  }
  return memoryCursor
}

export function advanceCursor(block: bigint) {
  if (!memoryCursor) return
  if (block > memoryCursor.lastBlock) {
    memoryCursor.lastBlock = block
  }
}