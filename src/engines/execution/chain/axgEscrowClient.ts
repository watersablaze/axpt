import { createPublicClient, createWalletClient, http, parseAbi } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

/**
 * 🧾 AXG ESCROW ABI
 */
export const axgEscrowAbi = parseAbi([
  "function lockEscrow(bytes32 caseId,address from,address to,uint256 amount)",
  "function releaseEscrow(bytes32 caseId)",
  "event EscrowLocked(bytes32,address,address,uint256)",
  "event EscrowReleased(bytes32)"
])

/**
 * 🌐 CLIENTS
 */
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL!)
})

const account = privateKeyToAccount(
  process.env.PRIVATE_KEY as `0x${string}`
)

export const walletClient = createWalletClient({
  account, // 👈 FIX: bind signer here
  chain: sepolia,
  transport: http(process.env.RPC_URL!)
})

/**
 * 📍 CONTRACT ADDRESS
 */
export const AXG_ESCROW_ADDRESS =
  process.env.AXG_ESCROW_ADDRESS as `0x${string}`

/**
 * 🔒 LOCK ESCROW (ON-CHAIN)
 */
export async function lockEscrowOnChain(params: {
  caseId: `0x${string}`
  from: `0x${string}`
  to: `0x${string}`
  amount: bigint
}) {
  const hash = await walletClient.writeContract({
    address: AXG_ESCROW_ADDRESS,
    abi: axgEscrowAbi,
    functionName: "lockEscrow",
    args: [params.caseId, params.from, params.to, params.amount],
  })

  // ⚡ WAIT FOR FINALITY (CRITICAL FOR WAR ROOM)
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })

  return {
    txHash: hash,
    transactionHash: hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status === "success" ? "CONFIRMED" : "FAILED",
  }
}

/**
 * 🔓 RELEASE ESCROW (ON-CHAIN)
 */
export async function releaseEscrowOnChain(params: {
  caseId: `0x${string}`
}) {
  const hash = await walletClient.writeContract({
    address: AXG_ESCROW_ADDRESS,
    abi: axgEscrowAbi,
    functionName: "releaseEscrow",
    args: [params.caseId],
  })

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  })

  return {
    txHash: hash,
    transactionHash: hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status === "success" ? "CONFIRMED" : "FAILED",
  }
}
