import { AXPTRuntime } from '../../src/engines/runtime/AXPTRuntime.js'
import type { TransferRequest } from '../../src/engines/execution/transfer/TransferTypes'

async function run() {
  const runtime = new AXPTRuntime()

  const testTx: TransferRequest = {
    idempotencyKey: "tx_test_001",
    fromUserId: "user_A",
    toUserId: "user_B",
    assetCode: "AXG",
    amount: 100000,
    metadata: {
      purpose: "full_system_test",
    },
  }

  console.log("🧬 AXPT EXECUTION LOOP START")

  const result = await runtime.executeTransfer(testTx)

  console.log("⚡ RESULT:")
  console.log(JSON.stringify(result, null, 2))

  console.log("🧠 LOOP COMPLETE")
}

run().catch((err) => {
  console.error("❌ EXECUTION LOOP FAILED:", err)
})