import { runAutomationCycle } from "./engine"

let isRunning = false

export function startAutomationLoop() {
  if (isRunning) return

  isRunning = true

  console.log("🧠 Automation loop started")

  async function loop() {
    try {
      const results = await runAutomationCycle()

      if (results.length > 0) {
        console.log("⚙️ Automation cycle:", results)
      }
    } catch (err) {
      console.error("❌ Automation loop error:", err)
    }

    setTimeout(loop, 5000) // 🔥 every 5 seconds
  }

  loop()
}