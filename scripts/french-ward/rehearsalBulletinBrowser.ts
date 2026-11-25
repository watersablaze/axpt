import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { chromium, type Browser } from "playwright-core";

import {
  BULLETIN_EDITORIAL_V1_PREFIX,
} from "../../app/french-ward/home/bulletinEditorial";

const database = "axpt_fw_bulletin_r1_rehearsal";
const url = new URL(process.env.DATABASE_URL ?? "");

assert.equal(url.protocol, "postgresql:");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5433");
assert.equal(url.username, "axpt");
assert.equal(url.pathname, `/${database}`);
assert.ok(url.password);
// Keep the rehearsal destination fixed while permitting only the
// known Prisma/PostgreSQL local connection options.
const expectedParams = new URLSearchParams([
  ["schema", "public"],
  ["sslmode", "disable"],
]);
assert.equal(url.searchParams.size, expectedParams.size);
for (const [key, value] of expectedParams) {
  assert.deepEqual(url.searchParams.getAll(key), [value]);
}

const db = new PrismaClient();
const origin = "http://127.0.0.1:3187";
const secret = randomBytes(48).toString("hex");
const tokenIds: string[] = [];
let browser: Browser | null = null;
let server: ChildProcess | null = null;
let createdPostId: string | null = null;
let serverOutput = "";

const title = "FW Weekly Administrative Coordination — Rehearsal";

const initialBody = [
  "## Administrative coordination",
  "",
  "**Meeting purpose:** Align weekly responsibilities and decisions.",
  "",
  "### Officer sequence",
  "",
  "1. **Bobby — Logistics:** Initiatives, requests and acquisitions.",
  "2. **Jamal — Strategy:** Implementation, culture and outlook.",
  "3. **Ma’yá — Infrastructure:** Administration, mechanisms and execution.",
  "4. **Lawrence — Accountability:** Ledger, legal, marketing, closure and QA.",
  "",
  "> Each matter should leave the meeting with an owner and next action.",
].join("\n");

const updatedBody = [
  initialBody,
  "",
  "### Follow-through",
  "",
  "**Updated decision:** Record unresolved matters for the next meeting.",
].join("\n");

async function unusedPort() {
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(3187, "127.0.0.1", () =>
      probe.close(() => resolve())
    );
  });
}

async function issueCookie(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });
  assert.ok(user);

  const tokenId = randomUUID();
  tokenIds.push(tokenId);

  await db.session.create({
    data: {
      userId,
      tokenId,
      status: "active",
      expiresAt: new Date(Date.now() + 20 * 60_000),
    },
  });

  const token = await new SignJWT({
    userId,
    tokenId,
    email: user.email,
    tier: "french-ward-governance",
    displayName: user.displayName,
    roles: [],
    docs: [],
    popupMessage: "Rehearsal",
    greeting: "Rehearsal",
    partner: "French-Ward",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(new TextEncoder().encode(secret));

  return token;
}

async function ready() {
  for (let i = 0; i < 90; i++) {
    if (server && server.exitCode !== null) {
      throw new Error(`Next.js stopped: ${server.exitCode}`);
    }

    try {
      const response = await fetch(
        `${origin}/admin/french-ward/bulletin`,
        {
          redirect: "manual",
          signal: AbortSignal.timeout(15000),
        },
      );
      if (response.status > 0) return;
    } catch {
      // Local compilation or startup may still be underway.
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error("Local application readiness timeout");
}

function assertNoStorageMarker(text: string, label: string) {
  assert.ok(
    !text.includes("FW-BULLETIN-EDITORIAL-V1"),
    `${label} exposed the editorial storage marker`,
  );
}

async function main() {
  const identity = await db.$queryRaw<
    Array<{ db: string; actor: string }>
  >`SELECT current_database() AS db, current_user AS actor`;

  assert.deepEqual(identity, [
    { db: database, actor: "axpt" },
  ]);

  assert.equal(await db.user.count(), 3);
  assert.equal(await db.frenchWardGoverningOfficer.count(), 2);
  assert.equal(await db.frenchWardOrientationCompletion.count(), 2);
  assert.equal(await db.session.count(), 0);
  assert.equal(await db.frenchWardBulletinPost.count(), 0);

  await unusedPort();
  console.log("PASS isolated database and browser port");

  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev", "--webpack",
      "-H", "127.0.0.1",
      "-p", "3187",
    ],
    {
      cwd: process.cwd(),
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "development",
        NODE_OPTIONS: "--max-old-space-size=4096",
        SIGNING_SECRET: secret,
        LOG_SECRET: randomBytes(32).toString("hex"),
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  );

  for (const stream of [server.stdout, server.stderr]) {
    stream?.on("data", chunk => {
      serverOutput =
        (serverOutput + String(chunk)).slice(-30000);
    });
  }

  await ready();
  console.log("PASS actual Next.js application started");

  browser = await chromium.launch({
    headless: true,
    timeout: 30000,
  });

  console.log("PASS Chromium browser launched");

  const publisherToken = await issueCookie(
    "fw-bulletin-r1-publisher"
  );
  const readerToken = await issueCookie(
    "fw-bulletin-r1-reader"
  );

  const publisherContext = await browser.newContext({
    baseURL: origin,
  });
  const readerContext = await browser.newContext({
    baseURL: origin,
  });

  await publisherContext.addCookies([{
    name: "axpt_session",
    value: publisherToken,
    url: origin,
    httpOnly: true,
    sameSite: "Lax",
  }]);

  await readerContext.addCookies([{
    name: "axpt_session",
    value: readerToken,
    url: origin,
    httpOnly: true,
    sameSite: "Lax",
  }]);

  const publisher = await publisherContext.newPage();
  const reader = await readerContext.newPage();

  publisher.setDefaultTimeout(20000);
  reader.setDefaultTimeout(20000);

  const editor = "/admin/french-ward/bulletin";
  const board = "/french-ward/home?module=bulletin";

  // -------------------------------------------------
  // 1. Actual editor and formatting controls.
  // -------------------------------------------------

  const publisherPageErrors: string[] = [];

  publisher.on("pageerror", error => {
    publisherPageErrors.push(error.message);
  });

  // Development compilation can delay DOMContentLoaded even after
  // the initial HTTP response. Qualify response and editor separately.
  const navigationStarted = Date.now();
  let publisherResponse;

  try {
    publisherResponse = await publisher.goto(editor, {
      waitUntil: "commit",
      timeout: 90000,
    });
  } catch (error) {
    console.log("PUBLISHER_NAVIGATION_FAILURE", JSON.stringify({
      elapsedMs: Date.now() - navigationStarted,
      pathname: new URL(publisher.url()).pathname,
      clientErrors: publisherPageErrors.slice(-5),
      serverExcerpt: serverOutput.split("\\n").slice(-15).join("\\n"),
    }));
    throw error;
  }

  console.log("PUBLISHER_HTTP_RESPONSE", JSON.stringify({
    httpStatus: publisherResponse?.status() ?? null,
    elapsedMs: Date.now() - navigationStarted,
    pathname: new URL(publisher.url()).pathname,
  }));

  const editorHeading = publisher.getByRole("heading", {
    name: "French-Ward Bulletin Board",
  });

  try {
    await editorHeading.waitFor({
      state: "visible",
      timeout: 90000,
    });
  } catch {
    const pageText = await publisher.locator("body")
      .innerText({ timeout: 5000 })
      .catch(() => "");

    const currentUrl = new URL(publisher.url());

    console.log("PUBLISHER_NAVIGATION_DIAGNOSTICS", JSON.stringify({
      httpStatus: publisherResponse?.status() ?? null,
      pathname: currentUrl.pathname,
      queryKeys: Array.from(currentUrl.searchParams.keys()),
      pageTitle: await publisher.title().catch(() => ""),
      editorHeadingCount: await editorHeading.count(),
      loginFormPresent:
        (await publisher.locator('input[type="password"]').count()) > 0,
      composerPresent:
        (await publisher.locator("#bulletin-composer").count()) > 0,
      nextNotFoundPresent:
        pageText.includes("404") ||
        pageText.includes("This page could not be found"),
      bodyExcerpt: pageText.slice(0, 600),
      pageErrors: publisherPageErrors.slice(-5),
    }));

    throw new Error(
      "PUBLISHER_NAVIGATION_NOT_QUALIFIED: see diagnostics above"
    );
  }

  console.log(
    "PASS publisher navigation and editor heading" +
    " · HTTP " + (publisherResponse?.status() ?? "unknown")
  );

  const formatSelector = publisher.locator("#bulletin-format");
  const headingTool = publisher.getByRole("button", {
    name: "Heading",
    exact: true,
  });

  // A visible server-rendered control does not prove client hydration.
  // Require an actual React state-driven preview update first.
  const hydrationInput =
    publisher.locator('textarea[name="body"]');

  let hydrated = false;

  for (let attempt = 0; attempt < 60; attempt++) {
    const probe = `FW_HYDRATION_PROBE_${attempt}`;

    await hydrationInput.fill(probe);

    // The preview reflects React state; textarea value alone is insufficient.
    const text = await publisher.locator("body").innerText();

    if (text.includes(probe)) {
      hydrated = true;
      break;
    }

    await publisher.waitForTimeout(350);
  }

  if (!hydrated) {
    console.log(
      "HYDRATION_READINESS_FAILURE",
      JSON.stringify({
        selectedFormat:
          await publisher.locator("#bulletin-format").inputValue(),
        hiddenFormat:
          await publisher.locator(
            'input[name="bodyFormat"]'
          ).inputValue(),
        clientErrors: publisherPageErrors.slice(-8),
      })
    );

    throw new Error(
      "EDITORIAL_CLIENT_HYDRATION_NOT_PROVEN"
    );
  }

  console.log("PASS client hydration proven by live preview");

  await hydrationInput.fill("");

  await publisher.getByText(
    "Begin writing to preview the bulletin."
  ).waitFor({
    state: "visible",
    timeout: 10000,
  });

  console.log("FORMAT_BEFORE_SELECTION", JSON.stringify({
    selected: await formatSelector.inputValue(),
    headingButtons: await headingTool.count(),
    clientErrors: publisherPageErrors.slice(-5),
  }));

  await formatSelector.selectOption("editorial-v1");

  try {
    await headingTool.waitFor({
      state: "visible",
      timeout: 6000,
    });
  } catch {
    const diagnostics = await publisher.evaluate(() => ({
      formatSelected: (
        document.querySelector("#bulletin-format") as
          HTMLSelectElement | null
      )?.value ?? null,
      hiddenFormat: (
        document.querySelector(
          'input[name="bodyFormat"]'
        ) as HTMLInputElement | null
      )?.value ?? null,
      toolbarButtons: Array.from(
        document.querySelectorAll("button")
      ).map(button => button.textContent?.trim()).filter(Boolean),
      composerPresent:
        !!document.querySelector("#bulletin-composer"),
      bodyExcerpt:
        document.body.innerText.slice(0, 800),
    }));

    console.log(
      "EDITORIAL_TOOLBAR_DIAGNOSTICS",
      JSON.stringify({
        ...diagnostics,
        clientErrors: publisherPageErrors.slice(-8),
      })
    );

    throw new Error(
      "EDITORIAL_TOOLBAR_NOT_READY: see diagnostics above"
    );
  }

  console.log("PASS styled editorial toolbar activated");

  // R1.9: The Divider tool must produce an actual horizontal
  // rule rather than turning the preceding line into a heading.
  const dividerTool = publisher.getByRole("button", {
    name: "Divider",
    exact: true,
  });
  await hydrationInput.fill("And if there is");
  await hydrationInput.evaluate((element) => {
    const field = element as HTMLTextAreaElement;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  });
  await dividerTool.click();
  await publisher.locator(
    'section[aria-label="Bulletin preview"] hr',
  ).waitFor({ state: "visible" });
  const dividerText = await hydrationInput.inputValue();
  assert.match(dividerText, /And if there is\n\n---\n\n/);
  assert.equal(
    await publisher.locator(
      'section[aria-label="Bulletin preview"] h2',
    ).filter({ hasText: "And if there is" }).count(),
    0,
  );
  console.log("PASS R1.9 divider renders a rule, not a heading");

  await hydrationInput.fill("");
  await headingTool.click();

  await publisher.locator('input[name="title"]')
    .fill(title);

  await publisher.locator('textarea[name="body"]')
    .fill(initialBody);

  await publisher.getByRole("heading", {
    name: "Administrative coordination",
  }).waitFor();

  assertNoStorageMarker(
    await publisher.locator("body").innerText(),
    "Editor preview",
  );

  console.log("PASS editor controls and styled preview");

  // -------------------------------------------------
  // 2. Save draft through actual server action.
  // -------------------------------------------------

  await publisher.getByRole("button", {
    name: "Save draft",
  }).click();

  await publisher.waitForURL(/saved=/, {
    timeout: 30000,
  });

  const drafts = await db.frenchWardBulletinPost.findMany({
    where: {
      title,
      authorUserId: "fw-bulletin-r1-publisher",
    },
  });

  assert.equal(drafts.length, 1);
  const draft = drafts[0];
  createdPostId = draft.id;

  assert.equal(draft.publishedAt, null);
  assert.equal(
    draft.body,
    BULLETIN_EDITORIAL_V1_PREFIX + initialBody,
  );

  assertNoStorageMarker(
    await publisher.locator("body").innerText(),
    "Publisher draft listing",
  );

  console.log("PASS draft persisted with exact editorial encoding");

  // -------------------------------------------------
  // 3. Verify draft is invisible to governing reader.
  // -------------------------------------------------

  await reader.goto(board);

  await reader.waitForLoadState("domcontentloaded");

  assert.ok(
    !(await reader.locator("body").innerText()).includes(title),
    "Unpublished draft leaked to governing reader",
  );

  console.log("PASS unpublished draft hidden from officer");

  // -------------------------------------------------
  // 4. Publish through actual server action.
  // -------------------------------------------------

  await publisher.locator("#bulletin-drafts")
    .getByRole("button", {
      name: "Publish to officers",
    }).click();

  await publisher.waitForURL(/published=/, {
    timeout: 30000,
  });

  const published =
    await db.frenchWardBulletinPost.findUniqueOrThrow({
      where: { id: draft.id },
    });

  assert.ok(published.publishedAt instanceof Date);
  assert.equal(published.body, draft.body);

  assertNoStorageMarker(
    await publisher.locator("body").innerText(),
    "Publisher published listing",
  );

  console.log("PASS published state recorded by server action");

  // -------------------------------------------------
  // 5. Open the exact published notice as a reader.
  // -------------------------------------------------

  const directLink =
    `${board}&post=${encodeURIComponent(draft.id)}`;

  await reader.goto(directLink);

  await reader.getByText(
    "Administrative coordination",
    { exact: true },
  ).waitFor();

  const readerText = await reader.locator("body").innerText();

  assert.ok(readerText.includes("Bobby"));
  assert.ok(readerText.includes("Jamal"));
  assert.ok(readerText.includes("Lawrence"));
  assertNoStorageMarker(readerText, "Officer direct link");

  assert.ok(
    await reader.locator("h2").filter({
      hasText: "Administrative coordination",
    }).count() > 0,
    "Expected semantic heading not rendered",
  );

  console.log("PASS direct-link opening and styled officer rendering");

  // -------------------------------------------------
  // R1.9. Officer reading experience and publish boundary.
  // -------------------------------------------------

  assert.equal(
    await reader.getByRole("link", { name: "Compose notice" }).count(),
    0,
    "Reader was incorrectly shown publisher entry",
  );
  assert.equal(
    await reader.getByRole("link", { name: "Manage drafts" }).count(),
    0,
    "Reader was incorrectly shown draft management",
  );

  await reader.getByText("The Bulletin", { exact: true }).waitFor();
  const archiveHeading = reader.getByRole("heading", {
    name: "Notice Archive",
    exact: true,
  });

  try {
    await archiveHeading.waitFor({
      state: "visible",
      timeout: 12000,
    });
  } catch (error) {
    const visibility = await reader.evaluate(() => {
      const heading = document.getElementById("bulletin-updates-title");
      const chain: Array<Record<string, unknown>> = [];
      let current: Element | null = heading;

      for (let i = 0; current && i < 8; i++) {
        const computed = window.getComputedStyle(current);
        const box = current.getBoundingClientRect();
        chain.push({
          tag: current.tagName,
          id: current.id || null,
          className: typeof current.className === "string"
            ? current.className.slice(0, 100) : "",
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          contentVisibility: computed.getPropertyValue("content-visibility"),
          width: Math.round(box.width),
          height: Math.round(box.height),
          offsetWidth: (current as HTMLElement).offsetWidth,
          offsetHeight: (current as HTMLElement).offsetHeight,
        });
        current = current.parentElement;
      }

      return {
        chain,
        viewport: {
          width: innerWidth,
          height: innerHeight,
        },
        archiveTextExists: Boolean(
          heading?.textContent?.includes("Notice Archive")
        ),
      };
    });
    console.log("R1.9 ARCHIVE_VISIBILITY_DIAGNOSTIC", JSON.stringify(visibility));
    throw error;
  }
  console.log("PASS R1.9 editorial masthead and reader-only controls");

  // This test runs on loopback, so the browser clipboard API is
  // available after granting exact clipboard permissions.
  await readerContext.grantPermissions([
    "clipboard-read",
    "clipboard-write",
  ]);
  await reader.getByRole("button", {
    name: "Copy notice link",
  }).click();
  await reader.getByRole("status")
    .filter({ hasText: "Link copied" }).waitFor();

  const copiedNoticeUrl = await reader.evaluate(async () =>
    navigator.clipboard.readText()
  );
  assert.equal(copiedNoticeUrl, origin + directLink);
  console.log("PASS R1.9 copy link yields exact published notice URL");

  await reader.getByRole("button", {
    name: title,
  }).last().click();
  assert.equal(
    new URL(reader.url()).searchParams.get("post"),
    draft.id,
  );
  console.log("PASS R1.9 archive selection preserves post identity");

  await reader.setViewportSize({ width: 390, height: 844 });
  const mobileOverflow = await reader.evaluate(() =>
    document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 2
  );
  assert.equal(mobileOverflow, false, "Mobile editorial board overflow");
  await reader.getByText("The Bulletin", { exact: true }).waitFor();
  console.log("PASS R1.9 mobile width and editorial content");

  await reader.setViewportSize({ width: 1280, height: 800 });
  const desktopLayout = await reader.evaluate(() => {
    const board = document.querySelector("[data-bulletin-board]");
    const reading = document.getElementById("bulletin-latest");
    const archive = document.getElementById("bulletin-updates");
    return {
      boardDisplay: board ? getComputedStyle(board).display : null,
      readingWidth: reading?.getBoundingClientRect().width ?? 0,
      archiveWidth: archive?.getBoundingClientRect().width ?? 0,
      pageOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 2,
    };
  });
  assert.equal(desktopLayout.boardDisplay, "block");
  assert.ok(desktopLayout.readingWidth > 300);
  assert.ok(desktopLayout.archiveWidth > 150);
  assert.equal(desktopLayout.pageOverflow, false);
  console.log("PASS R1.9 desktop layout without horizontal overflow");

  await publisher.goto(board);
  await publisher.getByRole("link", {
    name: "Compose notice",
  }).waitFor();
  await publisher.getByRole("link", {
    name: "Manage drafts",
  }).waitFor();
  await publisher.getByRole("link", {
    name: "Compose notice",
  }).click();
  await publisher.waitForURL(/\/admin\/french-ward\/bulletin/);
  console.log("PASS R1.9 authorized publisher enters canonical editor");

  // -------------------------------------------------
  // 6. Edit through actual publisher interface.
  // -------------------------------------------------

  await publisher.goto(editor);

  const publishedSection =
    publisher.locator("#bulletin-published");

  const postDetails =
    publishedSection.locator("details").filter({
      hasText: title,
    });

  await postDetails.locator("summary").click();
  await postDetails.getByRole("link", {
    name: "Edit",
  }).click();

  await publisher.locator('textarea[name="body"]')
    .fill(updatedBody);

  await publisher.getByRole("button", {
    name: "Save changes",
  }).click();

  await publisher.waitForURL(/updated=/, {
    timeout: 30000,
  });

  const updated =
    await db.frenchWardBulletinPost.findUniqueOrThrow({
      where: { id: draft.id },
    });

  assert.equal(
    updated.body,
    BULLETIN_EDITORIAL_V1_PREFIX + updatedBody,
  );

  assert.ok(updated.publishedAt instanceof Date);

  console.log("PASS published bulletin edited and persisted");

  // -------------------------------------------------
  // 7. Reader sees the updated notice.
  // -------------------------------------------------

  await reader.goto(directLink);

  await reader.getByText(
    "Updated decision:",
    { exact: false },
  ).waitFor();

  const finalText = await reader.locator("body").innerText();

  assert.ok(
    finalText.includes(
      "Record unresolved matters for the next meeting."
    )
  );

  assertNoStorageMarker(finalText, "Updated officer notice");

  console.log("PASS updated notice visible through original direct link");

  assert.equal(
    await db.frenchWardBulletinPost.count(),
    1,
  );

  console.log("PASS one bulletin throughout complete lifecycle");
  // A stale direct link must not silently select a different post.
  const missingPostId = "fw-bulletin-r1-nonexistent-post";
  const missingLink =
    `${board}&post=${encodeURIComponent(missingPostId)}`;

  await reader.goto(missingLink, {
    waitUntil: "commit",
    timeout: 90000,
  });

  const unavailableText = await reader.locator("body").innerText();

  assert.match(
    unavailableText,
    /unavailable|not found|does not exist/i,
    "Missing bulletin must have an explicit unavailable state",
  );

  assert.ok(
    !unavailableText.includes("Updated decision:"),
    "Missing direct link selected an unrelated published post",
  );

  assertNoStorageMarker(
    unavailableText,
    "Missing bulletin presentation",
  );

  console.log(
    "PASS nonexistent direct link fails closed without post substitution"
  );


  console.log("7/7 publication stages + R1.9 editorial acceptance PASS");
}

async function cleanup() {
  if (browser) {
    await browser.close();
  }

  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }

  if (createdPostId) {
    await db.frenchWardBulletinPost.deleteMany({
      where: {
        id: createdPostId,
        authorUserId: "fw-bulletin-r1-publisher",
        title,
      },
    });
  }

  if (tokenIds.length) {
    await db.session.deleteMany({
      where: {
        tokenId: { in: tokenIds },
        userId: {
          in: [
            "fw-bulletin-r1-publisher",
            "fw-bulletin-r1-reader",
          ],
        },
      },
    });
  }

  await db.$disconnect();
}

main()
  .catch(error => {
    console.error("BROWSER ACCEPTANCE FAILURE:", error);

    const diagnostics = serverOutput
      .split("\n")
      .filter(line =>
        /error|failed|prisma|cannot find|module not found/i.test(line)
      )
      .slice(-12);

    if (diagnostics.length) {
      console.error("SERVER DIAGNOSTICS:");
      for (const diagnostic of diagnostics) {
        console.error(diagnostic);
      }
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
      console.log("PASS synthetic bulletin and session cleanup");
    } catch (error) {
      console.error("CLEANUP FAILURE:", error);
      process.exitCode = 1;
    }
  });
