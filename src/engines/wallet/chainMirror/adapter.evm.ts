// src/engines/wallet/chainMirror/adapter.evm.ts
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import MirrorBridgeAbi from '@/abi/MirrorBridge.json'

const account = privateKeyToAccount(
  process.env.TREASURY_PRIVATE_KEY as `0x${string}`
)

const client = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL!)
})

export async function submitMirrorTx(job: any) {
  return client.writeContract({
    address: process.env.EVM_MIRROR_BRIDGE_ADDRESS as `0x${string}`,
    abi: MirrorBridgeAbi,
    functionName: 'mirrorTransfer',
    args: [
      job.idempotencyKey,
      job.walletEventId,
      job.tokenType,
      job.fromAddress,
      job.toAddress,
      BigInt(job.amount)
    ]
  })
}