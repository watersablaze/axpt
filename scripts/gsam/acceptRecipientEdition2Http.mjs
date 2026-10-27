import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import http from "node:http";
import os from "node:os";
import { createHash } from "node:crypto";
import { validateGsamEdition2Stage } from "./gsamEdition2CustodyExecutor.mjs";
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
let storageServer;
let tamperedKey = null;
const artifactBytes = new Map();

const sha256 = bytes =>
  createHash("sha256").update(bytes).digest("hex");

async function prepareFrozenFixtures() {
  const directory = path.join(
    os.homedir(), "Desktop", "gsam-ed2-custody-stage"
  );

  const validated = await validateGsamEdition2Stage({
    directory,
  });

  assert.equal(validated.length, 4);

  // Custody registry is append-only. Reuse only the exact
  // previously verified synthetic Edition 2 records.
  // Never create, update, or delete registry entries.
  assert.equal(
    await prisma.gsamScoEdition.count(),
    2,
    "STOP: isolated edition registry contains unexpected records",
  );

  for (const artifact of validated) {
    assert.equal(sha256(artifact.bytes), artifact.sha256);
    assert.ok(!artifactBytes.has(artifact.key));
    artifactBytes.set(artifact.key, Buffer.from(artifact.bytes));
  }

  for (const quantityMt of [100, 1000]) {
    const entries = validated.filter(
      entry => entry.quantityMt === quantityMt
    );
    assert.equal(entries.length, 2);

    const pdf = entries.find(entry => entry.format === "pdf");
    const html = entries.find(entry => entry.format === "html");
    assert.ok(pdf && html);

    const registered = await prisma.gsamScoEdition.findUnique({
      where: { reference: pdf.reference },
    });

    assert.ok(
      registered,
      `STOP: missing isolated ${quantityMt} MT registry`,
    );
    assert.equal(registered.quantityMt, quantityMt);
    assert.equal(registered.state, "CANDIDATE");
    assert.equal(registered.sourceSha256, "0".repeat(64));
    assert.equal(registered.pdfSha256, pdf.sha256);
    assert.equal(registered.htmlSha256, html.sha256);
    assert.equal(registered.pdfStorageKey, pdf.key);
    assert.equal(registered.htmlStorageKey, html.key);
  }

  console.log(
    "PASS: two existing append-only edition records verified"
  );

  return validated;
}

async function startStorageFixture() {
  assert.equal(storageServer, undefined);

  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(3100, "127.0.0.1", () => probe.close(resolve));
  });

  storageServer = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:3100");
    const prefix = "/gsam-local-acceptance/";

    if (req.method !== "GET" ||
        !url.pathname.startsWith(prefix)) {
      res.writeHead(404);
      res.end();
      return;
    }

    const key = decodeURIComponent(
      url.pathname.slice(prefix.length)
    );
    const original = artifactBytes.get(key);

    if (!original) {
      res.writeHead(404);
      res.end();
      return;
    }

    const bytes = key === tamperedKey
      ? Buffer.from("tampered local acceptance artifact")
      : original;

    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Length": bytes.byteLength,
    });
    res.end(bytes);
  });

  try {
    await new Promise((resolve, reject) => {
      storageServer.once("error", reject);
      storageServer.listen(3100, "127.0.0.1", resolve);
    });
  } catch (error) {
    storageServer.closeAllConnections();
    storageServer = undefined;
    throw error;
  }
}

async function stopStorageFixture() {
  if (!storageServer) return;
  const current = storageServer;
  storageServer = undefined;
  current.closeAllConnections();
  await new Promise((resolve, reject) =>
    current.close(error => error ? reject(error) : resolve())
  );
}


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
    NEXT_TELEMETRY_DISABLED: "1",
    AWS_ENDPOINT_URL_S3: "http://127.0.0.1:3100",
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "LOCAL_INERT_ACCEPTANCE",
    AWS_SECRET_ACCESS_KEY: "LOCAL_INERT_ACCEPTANCE",
    AXPT_TRANSACTION_DOCUMENT_BUCKET: "gsam-local-acceptance",
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

  const validated = await prepareFrozenFixtures();
  await startStorageFixture();

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

  // Positive delivery through the real authenticated HTTP routes.
  for (const artifact of validated) {
    const variant =
      artifact.quantityMt === 100 ? "100-mt" : "1000-mt";
    const person = artifact.quantityMt === 100
      ? hundred : thousand;

    const response = await get(
      `/api/french-ward/gsam-sco/${variant}/${artifact.format}`,
      person.cookie,
    );

    assert.equal(
      response.status, 200,
      `Positive ${variant} ${artifact.format} delivery`
    );

    const received = Buffer.from(await response.arrayBuffer());

    assert.equal(sha256(received), artifact.sha256);
    assert.deepEqual(received, Buffer.from(artifact.bytes));
    assert.equal(
      response.headers.get("cache-control"), "private, no-store"
    );
    assert.equal(
      response.headers.get("x-content-type-options"), "nosniff"
    );
    assert.equal(
      response.headers.get("x-robots-tag"), "noindex, nofollow"
    );

    if (artifact.format === "pdf") {
      assert.match(
        response.headers.get("content-type") || "",
        /^application\/pdf/
      );
      assert.match(
        response.headers.get("content-disposition") || "",
        /^attachment;/
      );
    } else {
      assert.match(
        response.headers.get("content-type") || "",
        /^text\/html/
      );
      assert.match(
        response.headers.get("content-disposition") || "",
        /^inline;/
      );
      assert.match(
        response.headers.get("content-security-policy") || "",
        /default-src 'none'/
      );
    }
  }

  console.log(
    "PASS: four authorized frozen HTML/PDF HTTP deliveries"
  );
  console.log(
    "PASS: exact hashes, bytes, MIME and security headers"
  );

  // The real verifier must reject corrupted bytes over HTTP.
  const pdf100 = validated.find(
    item => item.quantityMt === 100 && item.format === "pdf"
  );
  assert.ok(pdf100);

  tamperedKey = pdf100.key;
  try {
    const tampered = await get(
      "/api/french-ward/gsam-sco/100-mt/pdf",
      hundred.cookie,
    );
    assert.equal(tampered.status, 503);
  } finally {
    tamperedKey = null;
  }

  console.log("PASS: corrupted object rejected over HTTP");

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
    "PASS: authorized document delivery and corruption denial"
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
    await stopStorageFixture();
  } catch (error) {
    console.error("STORAGE CLEANUP FAILED:", redact(error));
    process.exitCode = 1;
  }

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
