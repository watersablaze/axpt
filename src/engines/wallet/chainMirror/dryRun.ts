import { createPublicClient, http, isAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import MirrorBridgeAbi from '../../../../abi/MirrorBridge.json'
import 'dotenv/config'

console.log('[ChainMirror DryRun] booting')

const RPC_URL =
  process.env.EVM_RPC_URL || process.env.SEPOLIA_RPC_URL

const PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY?.trim() as
  | `0x${string}`
  | undefined

const BRIDGE_ADDRESS = process.env.EVM_MIRROR_BRIDGE_ADDRESS as
  | `0x${string}`
  | undefined

if (!RPC_URL) throw new Error('Missing RPC URL')
if (!PRIVATE_KEY) throw new Error('Missing TREASURY_PRIVATE_KEY')
if (!BRIDGE_ADDRESS) throw new Error('Missing EVM_MIRROR_BRIDGE_ADDRESS')

if (!PRIVATE_KEY.startsWith('0x') || PRIVATE_KEY.length !== 66) {
  throw new Error('Invalid TREASURY_PRIVATE_KEY format')
}

if (!isAddress(BRIDGE_ADDRESS)) {
  throw new Error('Invalid EVM_MIRROR_BRIDGE_ADDRESS format')
}

const account = privateKeyToAccount(PRIVATE_KEY)
console.log('[ChainMirror DryRun] signer', account.address)

const publicClient = createPublicClient({
  transport: http(RPC_URL),
})

async function run() {
  const idempotencyKey = ('0x' + '11'.repeat(32)) as `0x${string}`
  const walletEventId = ('0x' + '22'.repeat(32)) as `0x${string}`
  const tokenType = ('0x' + '33'.repeat(32)) as `0x${string}`

  const gas = await publicClient.estimateContractGas({
    address: BRIDGE_ADDRESS!,
    abi: MirrorBridgeAbi,
    functionName: 'mirrorTransfer',
    args: [
      idempotencyKey,
      walletEventId,
      tokenType,
      account.address,
      account.address,
      123n,
    ],
    account,
  })

  console.log('[ChainMirror DryRun] estimated gas', gas.toString())
}

run()
  .then(() => {
    console.log('[ChainMirror DryRun] success')
    process.exit(0)
  })
  .catch((err) => {
    console.error('[ChainMirror DryRun] error', err)
    process.exit(1)
  })