import { createWalletClient, http } from "viem"
import { sepolia } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

export const account = privateKeyToAccount(
  process.env.EXECUTION_PRIVATE_KEY as `0x${string}`
)

export const axptClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.RPC_URL),
})