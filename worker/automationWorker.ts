import { runAutomationCycle } from "@/core/automation/engine"

async function startWorker() {
  console.log("⚙️ AXPT Automation Worker Started")

  while (true) {
    try {
      const results = await runAutomationCycle()

      console.log("🧠 Automation Cycle Complete:", results.length)

    } catch (err) {
      console.error("❌ Worker error:", err)
    }

    // ⏱️ loop interval
    await new Promise((r) => setTimeout(r, 5000))
  }
}

startWorker()