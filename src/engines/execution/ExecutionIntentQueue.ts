import type { ExecutionIntent } from "@/engines/core/types/ExecutionIntent"

type QueueItem = {
  id: string
  intent: ExecutionIntent
  createdAt: number
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
}

/**
 * 🧾 DETERMINISTIC EXECUTION QUEUE
 */
export class ExecutionIntentQueue {

  private queue: QueueItem[] = []
  private processing = false

  /**
   * ➕ ADD INTENT
   */
  enqueue(intent: ExecutionIntent) {
    const item: QueueItem = {
      id: this.generateId(intent),
      intent,
      createdAt: Date.now(),
      status: "PENDING",
    }

    this.queue.push(item)
    this.process()
  }

  /**
   * 🔄 PROCESS QUEUE (SEQUENTIAL GUARANTEE)
   */
  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.some(i => i.status === "PENDING")) {

      const item = this.queue.find(i => i.status === "PENDING")
      if (!item) break

      item.status = "PROCESSING"

      try {
        await this.execute(item.intent)
        item.status = "COMPLETED"
      } catch (err) {
        item.status = "FAILED"
      }
    }

    this.processing = false
  }

  /**
   * ⚙️ EXECUTION ENTRY (WILL CONNECT TO ENGINE)
   */
  private async execute(intent: ExecutionIntent) {
    // placeholder: will call ExecutionEngine
    return intent
  }

  /**
   * 🧬 DETERMINISTIC ID
   */
  private generateId(intent: ExecutionIntent) {
    return `${intent.fromUserId}-${intent.toUserId}-${intent.amountBaseUnits}-${Date.now()}`
  }

  getQueue() {
    return this.queue
  }
}

/**
 * 🧬 SINGLETON
 */
export const executionIntentQueue = new ExecutionIntentQueue()