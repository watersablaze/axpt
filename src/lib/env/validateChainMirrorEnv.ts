import { config } from 'dotenv'
import { isAddress } from 'viem'

// Load both, with .env.local winning (matches expected dev precedence)
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
  if (!isAddress(v)) throw new Error(`[ENV] ${name} is not a valid EVM address`)
  return v as `0x${string}`
}

function reqInt(name: string): number {
  const n = Number(req(name))
  if (!Number.isInteger(n) || n <= 0) throw new Error(`[ENV] ${name} must be a positive integer`)
  return n
}

function optInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw || !raw.trim()) return fallback
  const n = Number(raw.trim())
  if (!Number.isInteger(n) || n <= 0) throw new Error(`[ENV] ${name} must be a positive integer`)
  return n
}

export function validateChainMirrorEnv() {
  console.log('[ENV] Validating ChainMirror…')

  const network = req('CHAIN_NETWORK')
  const rpcUrl = req('SEPOLIA_RPC_URL')

  // authority
  reqPk('TREASURY_PRIVATE_KEY')

  // contract binding
  const mirrorBridge = reqAddr('EVM_MIRROR_BRIDGE_ADDRESS')

  // worker knobs
  const pollMs = reqInt('CHAIN_MIRROR_POLL_MS')
  const batchSize = reqInt('CHAIN_MIRROR_BATCH_SIZE')

  // provider limits (Alchemy Free default)
  const maxBlocks = optInt('CHAIN_MIRROR_MAX_BLOCKS', 10)

  // start block (used when cursor not yet created)
  const startBlock = BigInt(optInt('CHAIN_MIRROR_START_BLOCK', 0))

  console.log('[ENV] ChainMirror OK')
  console.log('[ENV] Summary:')
  console.log('  network:', network)
  console.log('  rpc:', rpcUrl)
  console.log('  mirror bridge:', mirrorBridge)
  console.log('  poll ms:', pollMs)
  console.log('  batch size:', batchSize)
  console.log('  max blocks:', maxBlocks)
  console.log('  start block:', startBlock.toString())

  return { network, rpcUrl, mirrorBridge, pollMs, batchSize, maxBlocks, startBlock }
}

if (require.main === module) {
  validateChainMirrorEnv()
}