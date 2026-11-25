/**
 * FW-BULLETIN-R1.9B — Local, disposable, interactive visual acceptance.
 * Not a production authentication route; no access-code delivery.
 * Launch: node --env-file=.env.local --import tsx scripts/french-ward/reviewBulletinVisual.ts
 */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { chromium, type Browser } from "playwright-core";
import { BULLETIN_EDITORIAL_V1_PREFIX } from "../../app/french-ward/home/bulletinEditorial";

const DATABASE = "axpt_fw_bulletin_r1_rehearsal";
const ORIGIN = "http://127.0.0.1:3187";
const TITLE = "FW Weekly Administrative Coordination — Visual Rehearsal";
const db = new PrismaClient();
const signingSecret = randomBytes(48).toString("hex");
const tokenIds: string[] = [];
let postId: string | null = null;
let server: ChildProcess | null = null;
let browser: Browser | null = null;
let serverOutput = "";
let cleaning = false;

function assertConnection(value: string | undefined) {
  const url = new URL(value ?? "");
  assert.equal(url.protocol, "postgresql:");
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, "5433");
  assert.equal(url.username, "axpt");
  assert.equal(url.pathname, `/${DATABASE}`);
  assert.ok(url.password);
  assert.deepEqual(
    [...url.searchParams.entries()].sort(),
    [["schema", "public"], ["sslmode", "disable"]],
  );
}

async function issueCookie(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const tokenId = randomUUID();
  tokenIds.push(tokenId);
  await db.session.create({
    data: { userId, tokenId, status: "active", expiresAt: new Date(Date.now() + 15 * 60_000) },
  });
  return new SignJWT({
    userId, tokenId, email: user.email, tier: "french-ward-governance",
    displayName: user.displayName, roles: [], docs: [],
    popupMessage: "Visual rehearsal", greeting: "Visual rehearsal", partner: "French-Ward",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(signingSecret));
}

async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  console.log("\nVISUAL_REHEARSAL_CLEANUP_BEGIN");
  const errors: string[] = [];
  try { await browser?.close(); } catch (error) { errors.push(String(error)); }
  if (server?.pid) {
    try { process.kill(-server.pid, "SIGTERM"); }
    catch { try { server.kill("SIGTERM"); } catch {} }
  }
  try {
    if (postId) {
      const deleted = await db.frenchWardBulletinPost.deleteMany({
        where: { id: postId, authorUserId: "fw-bulletin-r1-publisher", title: TITLE },
      });
      assert.equal(deleted.count, 1);
    }
    if (tokenIds.length) {
      const deleted = await db.session.deleteMany({
        where: {
          tokenId: { in: tokenIds },
          userId: { in: ["fw-bulletin-r1-publisher", "fw-bulletin-r1-reader"] },
        },
      });
      assert.equal(deleted.count, tokenIds.length);
    }
    assert.equal(await db.session.count(), 0);
    assert.equal(await db.frenchWardBulletinPost.count(), 0);
  } catch (error) { errors.push(String(error)); }
  await db.$disconnect();
  if (errors.length) {
    process.exitCode = 1;
    console.error("REHEARSAL_CLEANUP_INCOMPLETE", errors.join("; "));
  } else {
    console.log("PASS synthetic post and sessions removed");
    console.log("VISUAL_REHEARSAL_CLEANUP_COMPLETE");
  }
}

async function review() {
  assertConnection(process.env.DATABASE_URL);
  assertConnection(process.env.DIRECT_URL);
  const identity = await db.$queryRaw<Array<{ db: string; actor: string }>>`
    SELECT current_database() AS db, current_user AS actor
  `;
  assert.deepEqual(identity, [{ db: DATABASE, actor: "axpt" }]);
  const counts = await Promise.all([
    db.user.count(),
    db.frenchWardGoverningOfficer.count(),
    db.frenchWardOrientationCompletion.count(),
    db.session.count(),
    db.frenchWardBulletinPost.count(),
  ]);
  assert.deepEqual(counts, [3, 2, 2, 0, 0]);
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(3187, "127.0.0.1", () => probe.close(() => resolve()));
  });
  console.log("PASS exact disposable database, clean fixtures and free port");

  server = spawn(process.execPath, [
    "node_modules/next/dist/bin/next", "dev", "--webpack",
    "-H", "127.0.0.1", "-p", "3187",
  ], {
    cwd: process.cwd(), detached: true, stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env, NODE_ENV: "development", NODE_OPTIONS: "--max-old-space-size=4096",
      SIGNING_SECRET: signingSecret, LOG_SECRET: randomBytes(32).toString("hex"),
      RESEND_API_KEY: "", NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  for (const stream of [server.stdout, server.stderr]) {
    stream?.on("data", chunk => {
      serverOutput = (serverOutput + String(chunk)).slice(-6000);
    });
  }
  let serverReady = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(ORIGIN + "/login", { signal: AbortSignal.timeout(12000) });
      if (response.status > 0) { serverReady = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(serverReady, `Next.js startup failed: ${serverOutput.slice(-1200)}`);
  console.log("PASS actual local Next.js application");

  const publisherToken = await issueCookie("fw-bulletin-r1-publisher");
  const readerToken = await issueCookie("fw-bulletin-r1-reader");
  const body = [
    "## Administrative coordination", "",
    "The Bulletin is a shared record of institutional notices, operating priorities and decisions.", "",
    "### Officer sequence", "",
    "1. **Bobby** — Logistics, initiatives and acquisitions.",
    "2. **Jamal** — Strategy, culture and outlook.",
    "3. **Ma’yá** — Administration and digital infrastructure.",
    "4. **Lawrence** — Legal, ledger, closure and QA.", "",
    "---", "",
    "> Every matter should leave with an owner and next action.", "",
    "### Next coordination", "",
    "Review outstanding decisions and carry forward unresolved matters.",
  ].join("\n");
  const post = await db.frenchWardBulletinPost.create({
    data: {
      authorUserId: "fw-bulletin-r1-publisher",
      title: TITLE, body: BULLETIN_EDITORIAL_V1_PREFIX + body,
      publishedAt: new Date(), urgent: false,
    },
  });
  postId = post.id;
  browser = await chromium.launch({ headless: false, timeout: 30000 });

  async function open(label: string, token: string, viewport: { width: number; height: number }, pathname: string) {
    const context = await browser!.newContext({ baseURL: ORIGIN, viewport });
    await context.addCookies([{
      name: "axpt_session", value: token, url: ORIGIN,
      httpOnly: true, sameSite: "Lax",
    }]);
    const page = await context.newPage();
    const response = await page.goto(pathname, { waitUntil: "domcontentloaded", timeout: 90000 });
    assert.equal(response?.status(), 200);
    await page.locator("[data-fw-bulletin-posts], #bulletin-composer").first()
      .waitFor({ state: "visible", timeout: 90000 });
    console.log(`PASS ${label} opened — ${page.url()}`);
    return page;
  }

  const path = `/french-ward/home?module=bulletin&post=${encodeURIComponent(post.id)}`;
  await open("DESKTOP READER 1440×900", readerToken, { width: 1440, height: 900 }, path);
  await open("MOBILE READER 390×844", readerToken, { width: 390, height: 844 }, path);
  await open("PUBLISHER EDITOR 1365×900", publisherToken, { width: 1365, height: 900 }, "/admin/french-ward/bulletin");

  console.log("\nVISUAL_REVIEW_ACTIVE — inspect all three browser tabs.");
  console.log("Press ENTER here to close and clean up (automatic stop after 12 minutes).");
  await new Promise<void>(resolve => {
    const finish = () => {
      process.stdin.off("data", finish);
      process.off("SIGINT", finish);
      resolve();
    };
    process.stdin.resume();
    process.stdin.once("data", finish);
    process.once("SIGINT", finish);
    setTimeout(finish, 12 * 60_000).unref();
  });
}

review()
  .catch(error => {
    process.exitCode = 1;
    console.error("VISUAL_REHEARSAL_FAILED", error instanceof Error ? error.message : String(error));
  })
  .finally(cleanup);
