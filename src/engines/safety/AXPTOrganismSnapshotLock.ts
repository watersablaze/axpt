import type { UnifiedOrganismState } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'

export class AXPTOrganismSnapshotLock {
  private locked: UnifiedOrganismState | null = null

  lock(state: UnifiedOrganismState) {
    this.locked = structuredClone(state)
  }

  getLocked() {
    if (!this.locked) {
      throw new Error('ORGANISM_NOT_LOCKED')
    }
    return this.locked
  }

  verify(current: UnifiedOrganismState) {
    if (!this.locked) return false

    return this.locked.timestamp === current.timestamp
  }

  clear() {
    this.locked = null
  }
}

export const organismSnapshotLock = new AXPTOrganismSnapshotLock()