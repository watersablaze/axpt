export const GM_REFERENCE = "GM-KENYA-RCF-001";
export const GM_ROUTE = "/french-ward/instruments/gm-kenya";
export const GM_PENDING_COOKIE = "axpt_gm_pending";
export const GM_CHALLENGE_COOKIE = "axpt_gm_challenge";
export const GM_SESSION_COOKIE = "axpt_gm_recipient";
export const PIN_TTL_MS = 10 * 60_000;
export const SEND_COOLDOWN_MS = 60_000;
export const SEND_WINDOW_MS = 60 * 60_000;
export const MAX_SENDS = 5;
export const MAX_ATTEMPTS = 5;

export function canSendCode(row: {
  sentAt: Date; windowStartedAt: Date; sendCount: number;
} | null, now: Date) {
  if (!row) return true;
  return now.getTime() - row.sentAt.getTime() >= SEND_COOLDOWN_MS &&
    (now.getTime() - row.windowStartedAt.getTime() >= SEND_WINDOW_MS ||
      row.sendCount < MAX_SENDS);
}

export function canConsumeCode(row: {
  pinHash: string; nonceHash: string; expiresAt: Date;
  consumedAt: Date | null; attemptCount: number;
}, expected: { pinHash: string; nonceHash: string }, now: Date) {
  return !row.consumedAt && row.expiresAt > now && row.attemptCount < MAX_ATTEMPTS &&
    row.pinHash === expected.pinHash && row.nonceHash === expected.nonceHash;
}
