// src/lib/treasury/clients.ts
import { createPublicClient, http } from "viem"
import { mainnet } from "viem/chains"

const rpcUrl = process.env.RPC_URL

if (!rpcUrl) {
  throw new Error(
    "Missing RPC_URL. Set it in .env.local (Alchemy Ethereum Mainnet)."
  )
}

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
})