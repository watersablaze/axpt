// scripts/emit-mirror.ts
import 'dotenv/config'
import {
  createWalletClient,
  createPublicClient,
  http,
  keccak256,
  toBytes,
  parseEther,
  isAddress,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import MirrorBridgeAbi from '../abi/MirrorBridge.json'

const BRIDGE = '0x10A50500E973eAb5bFD19CFE3eb4e78f469DEf52' as const

const TEST_SENDER = '0xD1ac7f1FFFdC6689112fA2b59062Db92C07D67a7' as const
const TEST_RECEIVER = '0x210C240A35384c6b487f0b942060be3d0EA6B5d3' as const

function reqEnv(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) throw new Error(`Missing ${name}`)
  return v.trim()
}

function assertBytes32(label: string, v: Hex) {
  if (!v.startsWith('0x') || v.length !== 66) {
    throw new Error(`${label} must be bytes32 (0x + 64 hex chars). Got: ${v}`)
  }
}

async function main() {
  const EVM_RPC_URL = reqEnv('EVM_RPC_URL')
  const TREASURY_PRIVATE_KEY = reqEnv('TREASURY_PRIVATE_KEY')

  if (!isAddress(BRIDGE)) throw new Error(`Invalid bridge address: ${BRIDGE}`)
  if (!isAddress(TEST_SENDER)) throw new Error(`Invalid TEST_SENDER: ${TEST_SENDER}`)
  if (!isAddress(TEST_RECEIVER)) throw new Error(`Invalid TEST_RECEIVER: ${TEST_RECEIVER}`)

  const treasury = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`)

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(EVM_RPC_URL),
  })

  const walletClient = createWalletClient({
    account: treasury,
    chain: sepolia,
    transport: http(EVM_RPC_URL),
  })

  const latest = await publicClient.getBlockNumber()
  console.log('[emit-mirror] RPC OK. latest block:', latest.toString())
  console.log('[emit-mirror] treasury:', treasury.address)

  const owner = await publicClient.readContract({
    address: BRIDGE,
    abi: MirrorBridgeAbi as any,
    functionName: 'owner',
  })

  console.log('[emit-mirror] MirrorBridge owner:', owner)

  if (typeof owner === 'string' && owner.toLowerCase() !== treasury.address.toLowerCase()) {
    throw new Error(
      `Treasury is NOT the contract owner. Only owner can call mirrorTransfer(). ` +
      `owner=${owner} treasury=${treasury.address}`
    )
  }

  const now = Date.now()
  const idempotencyKey = keccak256(toBytes(`id-${now}`)) as Hex
  const walletEventId = keccak256(toBytes(`wallet-${now}`)) as Hex
  const tokenType = keccak256(toBytes('AXPT_TEST')) as Hex

  assertBytes32('idempotencyKey', idempotencyKey)
  assertBytes32('walletEventId', walletEventId)
  assertBytes32('tokenType', tokenType)

  const amount = parseEther('1')

  console.log('[emit-mirror] Emitting MirrorTransfer...')
  console.log({
    idempotencyKey,
    walletEventId,
    tokenType,
    from: TEST_SENDER,
    to: TEST_RECEIVER,
    amount: amount.toString(),
  })

  const txHash = await walletClient.writeContract({
    address: BRIDGE,
    abi: MirrorBridgeAbi as any,
    functionName: 'mirrorTransfer',
    args: [idempotencyKey, walletEventId, tokenType, TEST_SENDER, TEST_RECEIVER, amount],
  })

  console.log('[emit-mirror] TX sent:', txHash)
  console.log('[emit-mirror] Waiting for confirmation...')

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log('[emit-mirror] Confirmed in block:', receipt.blockNumber?.toString())
  console.log('[emit-mirror] Status:', receipt.status)
}

main().catch((err) => {
  console.error('[emit-mirror] ERROR:', err)
  process.exit(1)
})