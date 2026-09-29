// Runs the real recipient route handlers against an isolated in-memory fixture.
// No database connection, email delivery, or application session is created.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { hashInstrumentAccessToken } from "../../src/domains/instruments/access/accessToken.ts";
import { GM_PENDING_COOKIE, GM_CHALLENGE_COOKIE, GM_SESSION_COOKIE } from "../../src/domains/instruments/access/globalMotherRecipientPolicy.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const token = randomUUID();
const state = globalThis.__gmRecipientTest = {
  jar: new Map(), delivered: [], challenges: new Map(), sessions: [], events: [],
  grant: null, principal: null,
};
function reset() {
  state.jar = new Map([[GM_PENDING_COOKIE, token]]);
  state.delivered = []; state.challenges = new Map(); state.sessions = []; state.events = [];
  state.grant = {
    id: "grant", codeHash: hashInstrumentAccessToken(token), instrumentId: "instrument",
    instrumentVersionId: "version", recipientUserId: "recipient", recipientName: "Recipient",
    representedInstitution: "Institution", representativeCapacity: "Representative",
    expiresAt: new Date(Date.now() + 86_400_000), revokedAt: null,
    accessLevel: "DELIBERATE", firstAccessAt: null, lastAccessAt: null,
  };
}
const user = { id: "recipient", email: "recipient@example.test", displayName: "Recipient", name: null };
const tx = {
  $queryRaw: async () => [{ id: "grant" }],
  institutionalInstrument: { findUnique: async () => ({ id: "instrument", reference: "GM-KENYA-RCF-001", currentVersion: 2 }) },
  instrumentVersion: { findUnique: async () => ({ instrumentId: "instrument", number: 2, status: "ISSUED" }) },
  user: { findUnique: async () => user },
  instrumentAccessGrant: {
    findUnique: async ({ where }) => (where.id === "grant" || where.codeHash === state.grant.codeHash) ? { ...state.grant } : null,
    updateMany: async ({ data }) => {
      if (state.grant.revokedAt || state.grant.expiresAt <= new Date()) return { count: 0 };
      Object.assign(state.grant, data); return { count: 1 };
    },
  },
  globalMotherRecipientChallenge: {
    findUnique: async ({ where }) => state.challenges.has(where.grantId) ? { ...state.challenges.get(where.grantId) } : null,
    upsert: async ({ where, create, update }) => {
      const row = state.challenges.has(where.grantId) ? { ...state.challenges.get(where.grantId), ...update } : { ...create };
      state.challenges.set(where.grantId, row); return row;
    },
    update: async ({ where, data }) => {
      const row = { ...state.challenges.get(where.grantId), ...data };
      state.challenges.set(where.grantId, row); return row;
    },
    updateMany: async ({ where, data }) => {
      const row = state.challenges.get(where.grantId);
      if (!row || row.pinHash !== where.pinHash || row.nonceHash !== where.nonceHash) return { count: 0 };
      Object.assign(row, data); return { count: 1 };
    },
  },
  session: {
    create: async ({ data }) => { state.sessions.push({ id: "session", ...data }); return data; },
    findUnique: async ({ where }) => state.sessions.find(row => row.tokenId === where.tokenId) ?? null,
  },
  domainEvent: { create: async ({ data }) => { state.events.push(data); return data; } },
};
let queue = Promise.resolve();
state.prisma = {
  ...tx,
  $transaction: async callback => {
    const previous = queue;
    let release;
    queue = new Promise(done => { release = done; });
    await previous;
    try { return await callback(tx); } finally { release(); }
  },
};
const virtual = {
  "server-only": "export {};",
  "next/headers": 'export async function cookies() { return { get(name) { const value = globalThis.__gmRecipientTest.jar.get(name); return value === undefined ? undefined : { value }; } }; }',
  "@/infrastructure/db/prisma": "export const prisma = globalThis.__gmRecipientTest.prisma;",
  "@/infrastructure/env/secrets": 'export const SIGNING_SECRET = new TextEncoder().encode("isolated-test-key");',
  "@/domains/auth/getPrincipal": "export async function getPrincipal() { return globalThis.__gmRecipientTest.principal; }",
  "@/domains/instruments/access/sendGlobalMotherRecipientPin": "export async function sendGlobalMotherRecipientPin(email, pin) { globalThis.__gmRecipientTest.delivered.push({ email, pin }); }",
};
registerHooks({
  resolve(specifier, context, next) {
    if (virtual[specifier]) return { url: "gm-test:" + specifier, shortCircuit: true };
    if (specifier === "next/server") return next("next/server.js", context);
    if (specifier.startsWith("@/")) {
      const path = resolve(root, "src", specifier.slice(2));
      if (existsSync(path + ".ts")) return { url: pathToFileURL(path + ".ts").href, shortCircuit: true };
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const path = resolve(dirname(fileURLToPath(context.parentURL)), specifier);
      if (existsSync(path + ".ts")) return { url: pathToFileURL(path + ".ts").href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("gm-test:")) return { format: "module", source: virtual[url.slice(8)], shortCircuit: true };
    return next(url, context);
  },
});
const { POST: send } = await import("../../app/french-ward/instruments/gm-kenya/verify/request/route.ts");
const { POST: confirm } = await import("../../app/french-ward/instruments/gm-kenya/verify/confirm/route.ts");
const { getGlobalMotherPrincipal } = await import("../../src/domains/instruments/access/globalMotherRecipientAuth.ts");
const { jwtVerify } = await import("jose");
const origin = "https://preview.example.test";
function request(path, body, requestOrigin = origin) {
  return new Request(origin + path, { method: "POST", headers: { origin: requestOrigin, "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
}
function remember(response) {
  for (const cookie of response.cookies.getAll()) {
    if (cookie.value) state.jar.set(cookie.name, cookie.value);
    else state.jar.delete(cookie.name);
  }
}
async function issueCode() {
  const response = await send(request("/verify/request"));
  assert.equal(response.status, 200); remember(response);
  return state.delivered.at(-1).pin;
}
const verify = pin => confirm(request("/verify/confirm", { pin }));

reset();
assert.equal((await send(request("/verify/request", {}, "https://other.example.test"))).status, 403);
state.jar.clear();
assert.equal((await send(request("/verify/request"))).status, 401);
reset(); state.grant.revokedAt = new Date();
assert.equal((await send(request("/verify/request"))).status, 403);
reset();
const sends = await Promise.all([send(request("/verify/request")), send(request("/verify/request"))]);
assert.deepEqual(sends.map(row => row.status).sort(), [200, 429]);
assert.equal(state.delivered.length, 1);
reset();
const pin = await issueCode();
assert.equal(state.delivered[0].email, user.email);
const verified = await Promise.all([verify(pin), verify(pin)]);
assert.deepEqual(verified.map(row => row.status).sort(), [200, 401]);
assert.equal(state.sessions.length, 1);
const successful = verified.find(row => row.status === 200);
const signed = successful.cookies.get(GM_SESSION_COOKIE).value;
await assert.rejects(jwtVerify(signed, new TextEncoder().encode("isolated-test-key")));
remember(successful);
const principal = await getGlobalMotherPrincipal();
assert.equal(principal.userId, user.id);
assert.deepEqual(principal.roles, []);
assert.deepEqual(principal.permissions, []);
state.grant.revokedAt = new Date();
assert.equal(await getGlobalMotherPrincipal(), null);
reset();
const secondPin = await issueCode();
const wrong = secondPin === "000000" ? "111111" : "000000";
for (let i = 0; i < 5; i++) assert.equal((await verify(wrong)).status, 401);
assert.equal((await verify(secondPin)).status, 401);
assert.equal(state.sessions.length, 0);
reset();
const revokedPin = await issueCode();
state.grant.revokedAt = new Date();
assert.equal((await verify(revokedPin)).status, 401);
reset();
const expiredPin = await issueCode();
state.challenges.get("grant").expiresAt = new Date(0);
assert.equal((await verify(expiredPin)).status, 401);
reset();
const browserPin = await issueCode();
state.jar.set(GM_CHALLENGE_COOKIE, "other-browser");
assert.equal((await verify(browserPin)).status, 401);
assert.equal(state.sessions.length, 0);
console.log("GM_RECIPIENT_ROUTES_PASSED · origin, missing access, revoked grant, concurrent sends, single-use verification, session isolation, attempt limit, expiry, browser binding");
