import "dotenv/config"
import { createWalletClient, createPublicClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"
import AXGEscrowAbi from "../src/contracts/abi/AXGEscrow.json"

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
})

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
})

const bytecode = process.env.AXG_ESCROW_BYTECODE as `0x${string}`

async function deploy() {
  console.log("🚀 Deploying AXGEscrow...")

  const hash = await walletClient.deployContract({
    abi: AXGEscrowAbi as any,
    bytecode,
    args: [],
  })

  console.log("📡 TX HASH:", hash)

  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  console.log("✅ DEPLOYED CONTRACT:")
  console.log(receipt.contractAddress)

  return receipt.contractAddress
}

deploy().catch(console.error)