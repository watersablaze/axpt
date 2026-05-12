export type OrganismVitals = {
  heartbeat: number          // events/sec
  pressure: number           // risk + drift combined (0–1)
  stability: number         // inverse of instability
  inflammation: number      // anomaly rate
  adaptation: number       // mutation frequency
  coherence: number        // guard pass rate
}

export type OrganismSnapshot = {
  timestamp: number
  vitals: OrganismVitals
}