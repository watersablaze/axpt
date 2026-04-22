import { formatEther, formatUnits } from "viem"
import { publicClient } from "./clients"
import { TREASURY_WALLETS, TOKENS } from "./config"
import { erc20Abi } from "./erc20Abi"

export type WalletSnapshot = {
  id: string
  name: string
  address: `0x${string}`
  role: "dev" | "operations" | "treasury"
  risk: "high" | "medium" | "low"
  eth: string
  usdt: string
}

export type TreasurySnapshot = {
  chain: "ethereum"
  network: "mainnet"
  generatedAt: string
  wallets: WalletSnapshot[]
  totals: {
    eth: string
    usdt: string
  }
}

function safeFixed(value: string, digits = 6) {
  const num = Number(value)
  if (!Number.isFinite(num)) return "0"
  return num.toFixed(digits)
}

export async function getTreasurySnapshot(): Promise<TreasurySnapshot> {
  const wallets = await Promise.all(
    TREASURY_WALLETS.map(async (wallet) => {
      const [ethBalance, usdtBalance] = await Promise.all([
        publicClient.getBalance({
          address: wallet.address,
        }),

        publicClient.readContract({
          address: TOKENS.USDT.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [wallet.address],
        }),
      ])

      return {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        role: wallet.role,
        risk: wallet.risk,
        eth: safeFixed(formatEther(ethBalance), 6),
        usdt: safeFixed(
          formatUnits(usdtBalance as bigint, TOKENS.USDT.decimals),
          2
        ),
      }
    })
  )

  const totalEth = wallets.reduce((sum, w) => sum + Number(w.eth), 0)
  const totalUsdt = wallets.reduce((sum, w) => sum + Number(w.usdt), 0)

  return {
    chain: "ethereum",
    network: "mainnet",
    generatedAt: new Date().toISOString(),
    wallets,
    totals: {
      eth: totalEth.toFixed(6),
      usdt: totalUsdt.toFixed(2),
    },
  }
}