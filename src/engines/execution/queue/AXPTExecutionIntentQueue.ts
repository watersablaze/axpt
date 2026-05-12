import type { ExecutionIntent } from '@/engines/core/types/ExecutionIntent'

type QueuedIntent = ExecutionIntent & {
  id: string
  status: 'PENDING' | 'APPROVED' | 'BLOCKED' | 'EXECUTED'
  createdAt: number
}

export class AXPTExecutionIntentQueue {
  private queue: QueuedIntent[] = []

  /**
   * 📥 PUSH INTENT INTO QUEUE
   */
  enqueue(intent: ExecutionIntent) {
    const item: QueuedIntent = {
      ...intent,
      id: this.generateId(intent),
      status: 'PENDING',
      createdAt: Date.now(),
    }

    this.queue.push(item)
    return item.id
  }

  /**
   * 📤 GET NEXT EXECUTABLE INTENT
   */
  getNext(): QueuedIntent | null {
    return this.queue.find(q => q.status === 'APPROVED') ?? null
  }

  /**
   * 🧠 UPDATE STATUS
   */
  updateStatus(id: string, status: QueuedIntent['status']) {
    const item = this.queue.find(q => q.id === id)
    if (item) item.status = status
  }

  /**
   * 🧬 SIMPLE DETERMINISTIC ID
   */
  private generateId(intent: ExecutionIntent) {
    return `${intent.fromUserId}-${intent.toUserId}-${intent.amountBaseUnits}-${Date.now()}`
  }
}

export const executionIntentQueue = new AXPTExecutionIntentQueue()