import { claimJobs } from './worker.claim'
import { processJob } from './worker.process'
import { confirmJobs } from './worker.confirm'
import { WORKER_LOOP_DELAY_MS } from './worker.config'

export async function runWorker() {
  const workerId = `worker-${Math.random().toString(36).slice(2)}`

  while (true) {
    try {
      const jobs = await claimJobs(workerId)

      for (const job of jobs) {
        await processJob(job, workerId)
      }

      await confirmJobs()

    } catch (err) {
      console.error('Worker error:', err)
    }

    await new Promise((r) => setTimeout(r, WORKER_LOOP_DELAY_MS))
  }
}

export const runChainMirrorWorker = runWorker
