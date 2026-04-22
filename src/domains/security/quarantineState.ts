import { getUserMetadata, mergeUserMetadata } from './mergeUserMetadata'

export async function applyQuarantine(userId: string, reason: string | string[]) {
  const normalizedReason = Array.isArray(reason) ? reason : [reason]

  await mergeUserMetadata(userId, {
    quarantine: true,
    quarantineReason: normalizedReason,
    quarantineAt: new Date().toISOString(),
  })
}

export async function clearQuarantine(userId: string) {
  await mergeUserMetadata(userId, {
    quarantine: false,
    quarantineReason: null,
    quarantineClearedAt: new Date().toISOString(),
  })
}

export async function isUserQuarantined(userId: string) {
  const metadata = await getUserMetadata(userId)
  return Boolean(metadata.quarantine)
}