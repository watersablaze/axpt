import { createWalletClient, createPublicClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"

/**
 * 🧠 AXPT VIEM CLIENT LAYER
 * single source of truth for chain interaction
 */

const rpcUrl = process.env.SEPOLIA_RPC_URL!
const privateKey = process.env.PRIVATE_KEY as `0x${string}`

if (!rpcUrl) throw new Error("Missing SEPOLIA_RPC_URL")
if (!privateKey) throw new Error("Missing PRIVATE_KEY")

export const account = privateKeyToAccount(privateKey)

export const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(rpcUrl),
})

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
})