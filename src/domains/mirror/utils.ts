export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function clampToRange(from: bigint, to: bigint, maxBlocks: bigint) {
  // inclusive range size = (to - from + 1)
  const size = to - from + 1n
  if (size <= maxBlocks) return { from, to }
  return { from, to: from + (maxBlocks - 1n) }
}