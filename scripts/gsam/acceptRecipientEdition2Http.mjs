import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { randomBytes, randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const root = process.cwd();
const database = "axpt_gsam_http_acceptance_20261025";
const dbUrl = process.env.DATABASE_URL;

assert.ok(dbUrl, "STOP: DATABASE_URL missing");
assert.equal(process.env.DIRECT_URL, dbUrl);

const url = new URL(dbUrl);
assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5432");
assert.equal(url.pathname, `/${database}`);
assert.equal(url.searchParams.get("schema"), "public");
assert.ok(url.username);

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

const prefix = `gsam-recipient-${randomUUID()}`;
const secret = randomBytes(48).toString("hex");
const port = 3099;
const base = `http://127.0.0.1:${port}`;
const room = "/french-ward/instruments/gsam-sco";

const references = {
  "100-mt": "GSAM-SCO-PROGRAM-100MT-2026-002",
  "1000-mt": "GSAM-SCO-PROGRAM-1000MT-2026-002",
};

const ids = {
  users: [],
  sessions: [],
  requests: [],
  grants: [],
};

let temporary;
let server;
let output = "";

function redact(value) {
  return String(value)
    .replaceAll(dbUrl, "[REDACTED_DB]")
    .replaceAll(secret, "[REDACTED_SECRET]")
    .replace(
      /postgres(?:ql)?:\/\/[^\s"'`]+/gi,
      "[REDACTED_CONNECTION]",
    );
}

function write(filename, contents) {
  const target = path.join(temporary, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function prepareApplication() {
  temporary = fs.mkdtempSync(
    path.join(root, ".gsam-recipient-http-"),
  );

  for (const name of ["node_modules", "src"]) {
    fs.symlinkSync(
      path.join(root, name),
      path.join(temporary, name),
      "dir",
    );
  }

  write("package.json", JSON.stringify({ private: true }));

  write("tsconfig.json", JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      esModuleInterop: true,
      baseUrl: ".",
      paths: { "@/*": ["src/*"] },
    },
  }));

  write(
    "next.config.mjs",
    `import path from "node:path";

export default {
  experimental: { externalDir: true },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/app/french-ward/instruments/gsam-sco/room.module.css":
        path.resolve(
          process.cwd(),
          "app/french-ward/instruments/gsam-sco/room.module.css"
        ),
    };
    return config;
  },
};
`,
  );

  write(
    "app/layout.tsx",
    "export default function Layout({children}){" +
    "return <html><body>{children}</body></html>}\n",
  );

  const routeFile =
    "app/french-ward/instruments/gsam-sco/page.tsx";

  const target = path.join(temporary, routeFile);
  let relative = path.relative(
    path.dirname(target),
    path.join(root, routeFile),
  ).split(path.sep).join("/").replace(/\.tsx$/, "");

  if (!relative.startsWith(".")) relative = "./" + relative;

  write(
    routeFile,
    `export { default } from ${JSON.stringify(relative)};\n` +
    'export const dynamic = "force-dynamic";\n',
  );

  const css =
    "app/french-ward/instruments/gsam-sco/room.module.css";

  fs.copyFileSync(
    path.join(root, css),
    path.join(temporary, css),
  );

  for (const kind of ["html", "pdf"]) {
    const routeFile =
      `app/api/french-ward/gsam-sco/[variant]/${kind}/route.ts`;

    const target = path.join(temporary, routeFile);

    let relative = path.relative(
      path.dirname(target),
      path.join(root, routeFile),
    ).split(path.sep).join("/").replace(/\\.ts$/, "");

    if (!relative.startsWith(".")) relative = "./" + relative;

    write(
      routeFile,
      `export { GET } from ${JSON.stringify(relative)};\n` +
      'export const dynamic = "force-dynamic";\n',
    );
  }

  write("app/api/acceptance-health/route.ts", `
import { prisma } from "@/infrastructure/db/prisma";
export async function GET() {
  const rows = await prisma.$queryRaw\`
    SELECT current_database() AS db,
           inet_server_port() AS port
  \`;
  return Response.json(rows[0]);
}
`);
}

async function portFree() {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => {
      probe.close(resolve);
    });
  });
}

async function start(flags) {
  await portFree();

  // Deliberately do not inherit production credentials.
  const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: "development",
    DATABASE_URL: dbUrl,
    DIRECT_URL: dbUrl,
    SIGNING_SECRET: secret,
    LOG_SECRET: randomBytes(48).toString("hex"),
    GSAM_SCO_RECIPIENT_RELEASE:
      flags[0] ? "enabled" : "disabled",
    GSAM_SCO_FROZEN_EDITION_V2_READY:
      flags[1] ? "enabled" : "disabled",
  };

  output = "";

  server = spawn(process.execPath, [
    require.resolve("next/dist/bin/next"),
    "dev",
    temporary,
    "--webpack",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ], {
    cwd: temporary,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  for (const stream of [server.stdout, server.stderr]) {
    stream.on("data", chunk => {
      output = (output + redact(chunk)).slice(-10000);
    });
  }

  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null ||
        server.signalCode !== null) {
      throw Error("Acceptance server exited: " + output);
    }

    try {
      const response = await fetch(
        base + "/api/acceptance-health",
        { signal: AbortSignal.timeout(3000) },
      );

      if (response.ok) {
        const identity = await response.json();
        assert.equal(identity.db, database);
        assert.equal(identity.port, 5432);
        return;
      }
    } catch (error) {
      if (error instanceof assert.AssertionError) throw error;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw Error("Acceptance readiness timeout: " + output);
}

async function stop() {
  if (!server) return;

  const process = server;
  server = undefined;

  if (process.exitCode !== null ||
      process.signalCode !== null) return;

  const exited = new Promise(resolve =>
    process.once("exit", resolve),
  );

  process.kill("SIGTERM");

  await Promise.race([
    exited,
    new Promise(resolve => setTimeout(resolve, 5000)),
  ]);

  if (process.exitCode === null &&
      process.signalCode === null) {
    process.kill("SIGKILL");
    await exited;
  }
}

async function createRecipient(label) {
  const user = await prisma.user.create({
    data: {
      username: `${prefix}-${label}`,
      email: `${prefix}-${label}@example.invalid`,
      passwordHash: "INERT_ACCEPTANCE",
      displayName: "Synthetic GSAM Recipient",
      viewedDocs: [],
    },
  });

  ids.users.push(user.id);

  const tokenId = randomUUID();

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenId,
      status: "active",
      expiresAt: new Date(Date.now() + 3600000),
    },
  });

  ids.sessions.push(session.id);

  const token = await new SignJWT({
    userId: user.id,
    tokenId,
    email: user.email,
    tier: "member",
    roles: [],
    displayName: user.displayName,
    popupMessage: "Acceptance",
    greeting: "Acceptance",
    partner: "AXPT",
    docs: [],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  return {
    user,
    cookie: `axpt_session=${token}`,
  };
}

async function createGrant(person, reference, options = {}) {
  const request = await prisma.institutionalAccessRequest.create({
    data: {
      requesterName: "Synthetic GSAM Recipient",
      requesterEmail: person.user.email,
      institutionalAffiliation: "Local Acceptance",
      requesterCapacity: "Institutional Recipient",
      purpose: "Edition 2 HTTP acceptance",
      scope: "SUPPORTING_DOCUMENT_VIEW",
      resourceReference: reference,
      resourceVersion: 1,
      status: "APPROVED",
    },
  });

  ids.requests.push(request.id);

  const grant = await prisma.institutionalAccessGrant.create({
    data: {
      requestId: request.id,
      recipientUserId: person.user.id,
      recipientEmail: person.user.email,
      scope: "SUPPORTING_DOCUMENT_VIEW",
      resourceReference: reference,
      resourceVersion: 1,
      issuedByUserId: person.user.id,
      expiresAt: new Date(
        Date.now() + (options.expired ? -60000 : 3600000),
      ),
      revokedAt: options.revoked ? new Date() : null,
    },
  });

  ids.grants.push(grant.id);
}

async function get(route, cookie) {
  return fetch(base + route, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
    signal: AbortSignal.timeout(60000),
  });
}

async function verifyDatabase() {
  const rows = await prisma.$queryRaw`
    SELECT current_database() AS db,
           host(inet_server_addr()) AS host,
           inet_server_port() AS port
  `;

  assert.deepEqual(
    [rows[0].db, rows[0].host, rows[0].port],
    [database, "127.0.0.1", 5432],
  );
}

async function acceptance() {
  await verifyDatabase();
  await portFree();

  const hundred = await createRecipient("100");
  const thousand = await createRecipient("1000");
  const old = await createRecipient("old");
  const none = await createRecipient("none");
  const expired = await createRecipient("expired");
  const revoked = await createRecipient("revoked");

  await createGrant(hundred, references["100-mt"]);
  await createGrant(thousand, references["1000-mt"]);

  await createGrant(
    old,
    "GSAM-SCO-PROGRAM-100MT-2026-001",
  );

  await createGrant(
    expired,
    references["100-mt"],
    { expired: true },
  );

  await createGrant(
    revoked,
    references["100-mt"],
    { revoked: true },
  );

  prepareApplication();
  await start([true, true]);

  const anonymous = await get(room);

  assert.equal(anonymous.status, 307);
  assert.match(
    anonymous.headers.get("location") || "",
    /\/login\?next=/,
  );

  console.log("PASS: unauthenticated redirect");

  for (const person of [none, old, expired, revoked]) {
    const response = await get(room, person.cookie);
    assert.equal(
      response.status,
      404,
      `Expected denial for ${person.user.email}`,
    );
  }

  console.log("PASS: missing, old, expired, revoked grants");

  for (const [person, permitted, excluded] of [
    [hundred, "100-mt", "1000-mt"],
    [thousand, "1000-mt", "100-mt"],
  ]) {
    const response = await get(room, person.cookie);

    assert.equal(response.status, 200);

    const html = await response.text();

    assert.ok(
      html.includes(
        `/api/french-ward/gsam-sco/${permitted}/pdf`,
      ),
      "Authorized PDF action missing",
    );

    assert.ok(
      !html.includes(
        `/api/french-ward/gsam-sco/${excluded}/pdf`,
      ),
      "Unauthorized PDF action exposed",
    );
  }

  console.log("PASS: Edition 2 recipient separation");

  // Direct routes must independently deny recipients without
  // a valid Edition 2 grant, regardless of room presentation.
  for (const kind of ["html", "pdf"]) {
    for (const variant of ["100-mt", "1000-mt"]) {
      const url =
        `/api/french-ward/gsam-sco/${variant}/${kind}`;

      for (const person of [null, none, old, expired, revoked]) {
        const response = await get(url, person?.cookie);
        assert.equal(
          response.status,
          404,
          `Expected ${kind} denial for ${variant}`,
        );
      }

      const opposite =
        variant === "100-mt" ? thousand : hundred;

      assert.equal(
        (await get(url, opposite.cookie)).status,
        404,
        `Cross-document ${kind} access not denied`,
      );
    }
  }

  console.log(
    "PASS: direct HTML/PDF routes deny missing, " +
    "invalid and cross-document grants",
  );

  await stop();
  await start([false, true]);

  assert.equal(
    (await get(room, hundred.cookie)).status,
    404,
  );

  await stop();
  await start([true, false]);

  assert.equal(
    (await get(room, hundred.cookie)).status,
    404,
  );

  console.log("PASS: both release controls fail closed");

  console.log(
    "NOT COVERED: individual document HTTP delivery, " +
    "storage integrity and document response headers",
  );
}

async function cleanup() {
  await prisma.$transaction(async tx => {
    await tx.institutionalAccessEvent.deleteMany({
      where: { grantId: { in: ids.grants } },
    });

    await tx.institutionalAccessGrant.deleteMany({
      where: { id: { in: ids.grants } },
    });

    await tx.institutionalAccessRequest.deleteMany({
      where: { id: { in: ids.requests } },
    });

    await tx.session.deleteMany({
      where: { id: { in: ids.sessions } },
    });

    await tx.user.deleteMany({
      where: { id: { in: ids.users } },
    });
  });
}

let passed = false;

try {
  await acceptance();
  passed = true;
} catch (error) {
  console.error(redact(error?.stack ?? error));
  if (output) console.error(output);
  process.exitCode = 1;
} finally {
  await stop();

  try {
    await cleanup();
    console.log("Synthetic fixtures cleaned");
  } catch (error) {
    console.error("CLEANUP FAILED:", redact(error?.message ?? error));
    process.exitCode = 1;
  }

  await prisma.$disconnect();

  if (temporary) {
    fs.rmSync(temporary, {
      recursive: true,
      force: true,
    });
  }
}

if (passed && !process.exitCode) {
  console.log("GSAM_RECIPIENT_ED2_HTTP_ROOM_ACCEPTANCE_OK");
}
