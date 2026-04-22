export type AssetCode = "AXG" | "NMP" | "USD"

export type SettlementMode = "LEDGER_ONLY" | "MIRRORED" | "ON_CHAIN_NATIVE"
export type AssetStatus = "ACTIVE" | "RESEARCH" | "DISABLED"

export type AssetRegistryEntry = {
  code: AssetCode
  displaySymbol: string
  decimals: number
  mirrorTokenId: `0x${string}`
  contractAddress?: `0x${string}`
  chainId?: number
  settlementMode: SettlementMode
  status: AssetStatus
}

function toBytes32(text: string): `0x${string}` {
  const hex = Buffer.from(text, "utf8").toString("hex")
  return `0x${hex.padEnd(64, "0").slice(0, 64)}` as `0x${string}`
}

export const ASSET_REGISTRY: Record<AssetCode, AssetRegistryEntry> = {
  AXG: {
    code: "AXG",
    displaySymbol: "AXG",
    decimals: 6,
    mirrorTokenId: toBytes32("AXG"),
    settlementMode: "MIRRORED",
    status: "ACTIVE",
  },
  NMP: {
    code: "NMP",
    displaySymbol: "NMP",
    decimals: 6,
    mirrorTokenId: toBytes32("NMP"),
    settlementMode: "MIRRORED",
    status: "ACTIVE",
  },
  USD: {
    code: "USD",
    displaySymbol: "USD",
    decimals: 2,
    mirrorTokenId: toBytes32("USD"),
    settlementMode: "LEDGER_ONLY",
    status: "ACTIVE",
  },
}

export function getAsset(code: AssetCode): AssetRegistryEntry {
  const asset = ASSET_REGISTRY[code]
  if (!asset) throw new Error(`Unknown asset: ${code}`)
  return asset
}