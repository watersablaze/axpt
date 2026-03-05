// scripts/send-mirror.ts
import 'dotenv/config'
import { createWalletClient, http, keccak256, toBytes, parseEther, isAddress } from 'viem'
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

async function main() {
  const EVM_RPC_URL = reqEnv('EVM_RPC_URL')
  const TREASURY_PRIVATE_KEY = reqEnv('TREASURY_PRIVATE_KEY')

  if (!isAddress(BRIDGE)) throw new Error(`Invalid bridge address: ${BRIDGE}`)

  const treasury = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`)

  const client = createWalletClient({
    account: treasury,
    chain: sepolia,
    transport: http(EVM_RPC_URL),
  })

  const now = Date.now()
  const idempotencyKey = keccak256(toBytes(`id-${now}`))
  const walletEventId = keccak256(toBytes(`wallet-${now}`))
  const tokenType = keccak256(toBytes('AXPT_TEST'))

  const txHash = await client.writeContract({
    address: BRIDGE,
    abi: MirrorBridgeAbi as any,
    functionName: 'mirrorTransfer',
    args: [
      idempotencyKey,
      walletEventId,
      tokenType,
      TEST_SENDER,
      TEST_RECEIVER,
      parseEther('1'),
    ],
  })

  console.log('[send-mirror] MirrorTransfer TX:', txHash)
}

main().catch((err) => {
  console.error('[send-mirror] ERROR:', err)
  process.exit(1)
})