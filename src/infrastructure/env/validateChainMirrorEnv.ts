import { config } from 'dotenv'
import { isAddress } from 'viem'

// Load .env first, then override with .env.local
config({ path: '.env' })
config({ path: '.env.local', override: true })

function req(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) throw new Error(`[ENV] Missing: ${name}`)
  return v.trim()
}

function reqPk(name: string): `0x${string}` {
  const v = req(name)
  if (!v.startsWith('0x') || v.length !== 66) {
    throw new Error(`[ENV] ${name} must be 0x + 64 hex (32 bytes)`)
  }
  return v as `0x${string}`
}

function reqAddr(name: string): `0x${string}` {
  const v = req(name)
  if (!isAddress(v)) {
    throw new Error(`[ENV] ${name} is not a valid EVM address`)
  }
  return v as `0x${string}`
}

function reqPositiveInt(name: string): number {
  const n = Number(req(name))
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`[ENV] ${name} must be a positive integer`)
  }
  return n
}

function reqNonNegativeInt(name: string): number {
  const n = Number(req(name))
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`[ENV] ${name} must be a non-negative integer`)
  }
  return n
}

function optNonNegativeInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw || !raw.trim()) return fallback
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`[ENV] ${name} must be a non-negative integer`)
  }
  return n
}

export function validateChainMirrorEnv() {
  console.log('[ENV] Validating ChainMirror…')

  const network   = req('CHAIN_NETWORK')
  const rpcUrl    = req('CHAIN_MIRROR_RPC_URL')
  const chainId   = reqPositiveInt('CHAIN_ID')

  const treasuryPk    = reqPk('TREASURY_PRIVATE_KEY')
  const mirrorBridge  = reqAddr('CHAIN_MIRROR_BRIDGE')

  const pollMs    = reqPositiveInt('CHAIN_MIRROR_POLL_MS')
  const batchSize = reqPositiveInt('CHAIN_MIRROR_BATCH_SIZE')
  const maxBlocks = reqPositiveInt('CHAIN_MIRROR_MAX_BLOCKS')
  const confirmations = optNonNegativeInt('CHAIN_MIRROR_CONFIRMATIONS', 2)

  // 👇 THIS is the key fix
  const startBlock = reqNonNegativeInt('CHAIN_MIRROR_START_BLOCK')

  console.log('[ENV] ChainMirror OK')
  console.log('[ENV] Summary:')
  console.log('  network:', network)
  console.log('  chainId:', chainId)
  console.log('  rpc:', rpcUrl)
  console.log('  mirror bridge:', mirrorBridge)
  console.log('  poll ms:', pollMs)
  console.log('  batch size:', batchSize)
  console.log('  max blocks:', maxBlocks)
  console.log('  confirmations:', confirmations)
  console.log('  start block:', startBlock)

  return {
    network,
    rpcUrl,
    treasuryPk,
    mirrorBridge,
    pollMs,
    batchSize,
    maxBlocks,
    confirmations,
    startBlock,
    chainId,
  }
}
