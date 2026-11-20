import assert from "node:assert/strict";
import { canSendCode, canConsumeCode, MAX_ATTEMPTS, SEND_WINDOW_MS } from "../../src/domains/instruments/access/globalMotherRecipientPolicy.ts";

const now = new Date("2026-09-29T20:00:00Z");
assert.equal(canSendCode(null, now), true);
assert.equal(canSendCode({ sentAt: new Date(now.getTime() - 59_000), windowStartedAt: now, sendCount: 1 }, now), false);
assert.equal(canSendCode({ sentAt: new Date(now.getTime() - 60_000), windowStartedAt: now, sendCount: 1 }, now), true);
assert.equal(canSendCode({ sentAt: new Date(now.getTime() - 60_000), windowStartedAt: now, sendCount: 5 }, now), false);
assert.equal(canSendCode({ sentAt: new Date(now.getTime() - 60_000), windowStartedAt: new Date(now.getTime() - SEND_WINDOW_MS), sendCount: 5 }, now), true);
const row = { pinHash: "hash", nonceHash: "browser", attemptCount: 0, consumedAt: null, expiresAt: new Date(now.getTime() + 1000) };
assert.equal(canConsumeCode(row, row, now), true);
assert.equal(canConsumeCode({ ...row, consumedAt: now }, row, now), false);
assert.equal(canConsumeCode({ ...row, expiresAt: now }, row, now), false);
assert.equal(canConsumeCode({ ...row, attemptCount: MAX_ATTEMPTS }, row, now), false);
assert.equal(canConsumeCode(row, { pinHash: "replaced-code", nonceHash: row.nonceHash }, now), false);
assert.equal(canConsumeCode(row, { pinHash: row.pinHash, nonceHash: "other-browser" }, now), false);
console.log("GM_RECIPIENT_POLICY_PASSED · cooldown, hourly limit, expiry, attempt limit, replay, browser binding");
