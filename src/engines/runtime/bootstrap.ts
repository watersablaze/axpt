import { organismClock } from './serverSingletons'
import { executionSeal } from './AXPTExecutionSeal'

/**
 * 🧠 SAFE RUNTIME INITIALIZER
 * (runs AFTER all modules exist)
 */
export function initializeRuntime() {
  executionSeal.init()

  if (typeof organismClock.start === "function") {
    organismClock.start()
  }

  console.log('AXPT runtime initialized')
}
