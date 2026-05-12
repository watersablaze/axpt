import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"

const connection = new IORedis(process.env.REDIS_URL!)

export const executionQueue = new Queue("execution-intents", {
  connection,
})

export function addIntent(intent: any) {
  return executionQueue.add("execute", intent, {
    removeOnComplete: true,
    removeOnFail: false,
  })
}