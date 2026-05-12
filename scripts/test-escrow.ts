import { walletClient, publicClient } from "@/lib/evm/axptViemClient"
import AXGEscrowAbi from "@/contracts/abi/AXGEscrow.json"

const address = process.env.AXG_ESCROW_ADDRESS as `0x${string}`

async function run() {

  const caseId = `0x${Buffer.from("test-case-001").toString("hex").padEnd(64, "0").slice(0,64)}` as `0x${string}`

  console.log("🔒 Locking escrow...")

  const hash = await walletClient.writeContract({
    address,
    abi: AXGEscrowAbi,
    functionName: "lockEscrow",
    args: [
      caseId,
      "0x1111111111111111111111111111111111111111", // from
      "0x2222222222222222222222222222222222222222", // to
      1000000000000000000n // 1 AXG (mock units)
    ]
  })

  console.log("📡 TX:", hash)

  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  console.log("✅ CONFIRMED BLOCK:", receipt.blockNumber)

}

run()
