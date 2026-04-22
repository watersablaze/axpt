import cron from "node-cron"
import { runAutomationCycle } from "./engine"

export function startAutomationCron() {
  cron.schedule("*/30 * * * * *", async () => {
    console.log("🔁 Automation tick")
    await runAutomationCycle()
  })
}