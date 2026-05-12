import { createWalletClient, createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || process.env.EVM_RPC_URL
const privateKey = process.env.EXECUTION_PRIVATE_KEY || process.env.PRIVATE_KEY

if (!rpcUrl) throw new Error("Missing SEPOLIA_RPC_URL, RPC_URL, or EVM_RPC_URL")
if (!privateKey) throw new Error("Missing EXECUTION_PRIVATE_KEY or PRIVATE_KEY")

export const account = privateKeyToAccount(privateKey as `0x${string}`)

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl)
})

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(rpcUrl),
  account
})
