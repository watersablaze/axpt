import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import type { AssetCode } from '@/lib/assets/registry'
import {
  encodeWalletEventId,
  encodeIdempotencyKey,
  encodeTokenType,
  normalizeAddress,
  encodeAmount,
} from '@/domains/mirror/encoding'
import MirrorBridgeAbi from '../../../abi/MirrorBridge.json'

const account = privateKeyToAccount(
  process.env.TREASURY_PRIVATE_KEY as `0x${string}`
)

const client = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL!)
})

export async function submitMirrorTx(job: any) {
  const walletEventId = encodeWalletEventId(job.walletEventId)
  const idempotencyKey = encodeIdempotencyKey(job.idempotencyKey)
  const tokenType = encodeTokenType(job.assetCode as AssetCode)
  const from = normalizeAddress(job.fromAddress)
  const to = normalizeAddress(job.toAddress)
  const amount = encodeAmount(BigInt(job.amountBaseUnits.toString()))

  return client.writeContract({
    address: process.env.EVM_MIRROR_BRIDGE_ADDRESS as `0x${string}`,
    abi: MirrorBridgeAbi,
    functionName: 'mirrorTransfer',
    args: [
      idempotencyKey,
      walletEventId,
      tokenType,
      from,
      to,
      amount
    ]
  })
}
