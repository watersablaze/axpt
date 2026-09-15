// src/lib/treasury/clients.ts
import { createPublicClient, http } from "viem"
import { mainnet } from "viem/chains"

type TreasuryPublicClient = ReturnType<typeof createPublicClient>

let cachedPublicClient: TreasuryPublicClient | null = null

export function getPublicClient(): TreasuryPublicClient {
  if (cachedPublicClient) {
    return cachedPublicClient
  }

  const rpcUrl = process.env.RPC_URL?.trim()

  if (!rpcUrl) {
    throw new Error(
      "Missing RPC_URL. Configure the Ethereum Mainnet RPC environment."
    )
  }

  cachedPublicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })

  return cachedPublicClient
}
