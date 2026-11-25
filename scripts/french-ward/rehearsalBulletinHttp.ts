import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const target = "axpt_fw_bulletin_r1_rehearsal";
const port = 3187;
const origin = `http://127.0.0.1:${port}`;
const url = new URL(process.env.DATABASE_URL ?? "");

assert.equal(url.protocol, "postgresql:");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5433");
assert.equal(url.pathname, `/${target}`);
assert.equal(url.username, "axpt");
assert.ok(url.password);

const db = new PrismaClient();
const secret = randomBytes(48).toString("hex");
const tokenIds: string[] = [];
let server: ChildProcess | null = null;
let output = "";

const fixtures = [
  { id: "fw-bulletin-r1-publisher", label: "publisher" },
  { id: "fw-bulletin-r1-reader", label: "reader" },
  { id: "fw-bulletin-r1-denied", label: "denied" },
] as const;

function checkPortAvailable(): Promise<void> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => {
      probe.close(() => resolve());
    });
  });
}

async function request(path: string, cookie?: string) {
  const response = await fetch(`${origin}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.text();
  return {
    status: response.status,
    location: response.headers.get("location") ?? "",
    body,
  };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`Next.js exited with ${server.exitCode}`);
    }
    try {
      const response = await request(
        "/admin/french-ward/bulletin"
      );
      if (response.status > 0) return;
    } catch {
      // Server compilation may still be underway.
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Local Next.js server was not ready");
}

async function issueSession(id: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id } });
  assert.ok(user);

  const tokenId = randomUUID();
  tokenIds.push(tokenId);

  await db.session.create({
    data: {
      userId: id,
      tokenId,
      status: "active",
      expiresAt: new Date(Date.now() + 15 * 60_000),
    },
  });

  const token = await new SignJWT({
    userId: id,
    tokenId,
    email: user.email,
    tier:
      id === "fw-bulletin-r1-denied"
        ? "platform"
        : "french-ward-governance",
    displayName: user.displayName,
    roles: [],
    docs: [],
    popupMessage: "Rehearsal",
    greeting: "Rehearsal",
    partner: "French-Ward",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(secret));

  return `axpt_session=${token}`;
}

async function main() {
  const identity = await db.$queryRaw<
    Array<{ db: string; actor: string }>
  >`SELECT current_database() AS db, current_user AS actor`;

  assert.deepEqual(identity, [{ db: target, actor: "axpt" }]);

  assert.equal(await db.user.count(), 3);
  assert.equal(await db.frenchWardGoverningOfficer.count(), 2);
  assert.equal(await db.frenchWardOrientationCompletion.count(), 2);
  assert.equal(await db.session.count(), 0);
  assert.equal(await db.frenchWardBulletinPost.count(), 0);

  console.log("PASS exact synthetic database preflight");

  await checkPortAvailable();
  console.log(`PASS port ${port} available`);

  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev", "--webpack",
      "-H", "127.0.0.1",
      "-p", String(port),
    ],
    {
      cwd: process.cwd(),
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "development",
        NODE_OPTIONS: "--max-old-space-size=4096",
        DATABASE_URL: process.env.DATABASE_URL!,
        DIRECT_URL: process.env.DIRECT_URL!,
        SIGNING_SECRET: secret,
        LOG_SECRET: randomBytes(32).toString("hex"),
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  );

  for (const stream of [server.stdout, server.stderr]) {
    stream?.on("data", chunk => {
      output = (output + String(chunk)).slice(-24000);
    });
  }

  await waitForServer();
  console.log("PASS local Next.js application started");

  const cookies = new Map<string, string>();
  for (const fixture of fixtures) {
    cookies.set(fixture.label, await issueSession(fixture.id));
  }

  const results = [
    {
      label: "publisher editor",
      path: "/admin/french-ward/bulletin",
      cookie: cookies.get("publisher"),
    },
    {
      label: "reader editor denial",
      path: "/admin/french-ward/bulletin",
      cookie: cookies.get("reader"),
    },
    {
      label: "governing reader bulletin",
      path: "/french-ward/home?module=bulletin",
      cookie: cookies.get("reader"),
    },
    {
      label: "unauthorized actor FW Home",
      path: "/french-ward/home?module=bulletin",
      cookie: cookies.get("denied"),
    },
    {
      label: "unauthenticated editor",
      path: "/admin/french-ward/bulletin",
    },
  ];

  let failures = 0;

  for (const item of results) {
    try {
      const result = await request(item.path, item.cookie);
      const editorVisible =
        result.body.includes("French-Ward Bulletin Board");

      if (item.label === "reader editor denial") {
        const indicators = {
          httpStatus: result.status,
          bodyBytes: Buffer.byteLength(result.body),
          editorHeadingPresent: editorVisible,
          composerFormPresent:
            result.body.includes('id="bulletin-composer"'),
          draftActionPresent:
            result.body.includes("Save draft"),
          publishActionPresent:
            result.body.includes("Publish to officers"),
          notFoundTextPresent:
            /404|page could not be found|not found/i.test(result.body),
          noIndexPresent:
            /noindex/i.test(result.body),
          nextNotFoundPresent:
            /NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK/.test(result.body),
        };

        console.log(
          "READER_DENIAL_DIAGNOSTICS " +
          JSON.stringify(indicators)
        );

        if (
          indicators.composerFormPresent ||
          indicators.draftActionPresent ||
          indicators.publishActionPresent
        ) {
          console.log(
            "SECURITY FINDING: publisher controls present " +
            "in reader response"
          );
        }
      }
      if (item.label === "publisher editor") {
        console.log(
          "PUBLISHER_HTTP_DIAGNOSTICS",
          JSON.stringify({
            httpStatus: result.status,
            editorHeadingPresent: editorVisible,
            composerPresent:
              result.body.includes('id="bulletin-composer"'),
            saveDraftPresent:
              result.body.includes("Save draft"),
            styledOptionPresent:
              result.body.includes("Styled editorial"),
            forbiddenPresent:
              result.body.includes(
                "This session does not have admin access."
              ),
            unauthorizedPresent:
              result.body.includes(
                "No active admin session was found."
              ),
            notFoundPresent:
              result.body.includes("NEXT_HTTP_ERROR_FALLBACK"),
          })
        );
      }

      const accessApproved =
        item.label === "publisher editor"
          ? (
              result.status === 200 &&
              editorVisible &&
              result.body.includes('id="bulletin-composer"') &&
              result.body.includes("Save draft") &&
              result.body.includes("Styled editorial") &&
              !result.body.includes(
                "This session does not have admin access."
              ) &&
              !result.body.includes(
                "No active admin session was found."
              ) &&
              !result.body.includes("NEXT_HTTP_ERROR_FALLBACK")
            )
          : item.label === "reader editor denial"
            ? (
                [200, 404].includes(result.status) &&
                !editorVisible &&
                !result.body.includes('id="bulletin-composer"') &&
                !result.body.includes("Save draft") &&
                !result.body.includes("Publish to officers") &&
                result.body.includes("NEXT_HTTP_ERROR_FALLBACK")
              )
            : item.label === "governing reader bulletin"
              ? result.status === 200
              : item.label === "unauthorized actor FW Home"
                ? [302, 303, 307, 308].includes(result.status) &&
                  result.location.includes("/french-ward")
                : [302, 303, 307, 308].includes(result.status) &&
                  result.location.includes("/login");

      if (
        item.label === "reader editor denial" &&
        accessApproved &&
        result.status === 200
      ) {
        console.log(
          "QUALIFICATION: authorization denial confirmed; " +
          "HTTP 200 not-found status remains open"
        );
      }

      console.log(
        `${accessApproved ? "PASS" : "FAIL"} ${item.label}` +
        ` · HTTP ${result.status}` +
        (result.location ? ` · redirect ${result.location}` : "")
      );

      if (!accessApproved) failures++;
    } catch (error) {
      failures++;
      console.log(
        `FAIL ${item.label}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  assert.equal(
    await db.frenchWardBulletinPost.count(),
    0,
    "HTTP access rehearsal must not publish bulletins",
  );

  console.log("PASS no bulletin mutation");

  if (failures > 0) {
    console.log("\nLocal server diagnostic excerpt:");
    console.log(
      output.split("\n").filter(line =>
        /error|failed|prisma|missing|cannot find|module not found/i.test(line)
      ).slice(-16).join("\n")
    );
    throw new Error(`${failures} HTTP access checks failed`);
  }

  console.log("5/5 live HTTP authorization checks PASS");
}

async function cleanup() {
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
  if (tokenIds.length) {
    await db.session.deleteMany({
      where: { tokenId: { in: tokenIds } },
    });
  }
  await db.$disconnect();
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
      console.log("PASS local session and application cleanup");
    } catch (error) {
      console.error("CLEANUP FAILURE", error);
      process.exitCode = 1;
    }
  });
