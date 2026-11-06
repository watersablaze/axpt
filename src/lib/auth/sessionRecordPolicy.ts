export type PersistedSessionRecord = {
  userId: string
  status: string
  expiresAt: Date | null
  invalidatedAt: Date | null
  endedAt: Date | null
}

export function isActivePersistedSession(
  record: PersistedSessionRecord | null,
  claimedUserId: string,
  now: Date,
): boolean {
  return !!(
    record &&
    record.userId === claimedUserId &&
    record.status === 'active' &&
    record.invalidatedAt === null &&
    record.endedAt === null &&
    record.expiresAt instanceof Date &&
    Number.isFinite(record.expiresAt.getTime()) &&
    record.expiresAt.getTime() > now.getTime()
  )
}
