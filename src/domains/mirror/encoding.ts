import { keccak256, stringToHex, isAddress, getAddress, hexToString } from 'viem'
import { ASSET_REGISTRY, getAsset, type AssetCode } from '@/lib/assets/registry'

export function encodeWalletEventId(id: string): `0x${string}` {
  return keccak256(stringToHex(`wallet-event:${id}`))
}

export function encodeIdempotencyKey(key: string): `0x${string}` {
  return keccak256(stringToHex(`mirror:${key}`))
}

export function encodeTokenType(assetCode: AssetCode): `0x${string}` {
  return getAsset(assetCode).mirrorTokenId
}

export function decodeTokenType(tokenType: string): AssetCode | string {
  try {
    const decoded = hexToString(tokenType as `0x${string}`).replace(/\0/g, '')
    if (decoded in ASSET_REGISTRY) {
      return decoded as AssetCode
    }
    return decoded || tokenType
  } catch {
    return tokenType
  }
}

export function normalizeAddress(address: string): `0x${string}` {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`)
  }
  return getAddress(address)
}

export function encodeAmount(amountBaseUnits: bigint): bigint {
  if (amountBaseUnits < 0n) {
    throw new Error('Negative amounts not allowed in mirror')
  }
  return amountBaseUnits
}
