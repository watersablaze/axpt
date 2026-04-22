import { computeUserTrustState } from './computeUserTrustState'
import { deriveTrustScore } from './deriveTrustScore'

export async function getUserTrustScore(userId: string) {
  const state = await computeUserTrustState(userId)
  return deriveTrustScore(state)
}