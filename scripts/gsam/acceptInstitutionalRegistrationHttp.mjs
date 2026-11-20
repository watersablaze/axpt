import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { randomUUID, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const root = process.cwd();
const dbName = "axpt_gsam_http_acceptance_20261025";
const dbUrl = process.env.DATABASE_URL;
assert.ok(dbUrl, "STOP: DATABASE_URL is required");

const parsedDbUrl = new URL(dbUrl);

assert.ok(
  ["postgresql:", "postgres:"].includes(parsedDbUrl.protocol),
  "STOP: invalid database protocol"
);
assert.equal(parsedDbUrl.hostname, "127.0.0.1");
assert.equal(parsedDbUrl.port, "5432");
assert.equal(parsedDbUrl.pathname, `/${dbName}`);
assert.equal(parsedDbUrl.searchParams.get("schema"), "public");
assert.ok(parsedDbUrl.username, "STOP: explicit database user required");
assert.equal(
  process.env.DIRECT_URL,
  dbUrl,
  "STOP: DIRECT_URL must equal isolated DATABASE_URL"
);
const port = 3098;
const origin = `http://localhost:${port}`;
const route = "/api/admin/representative-program/institutional-participations/gsam/register";
const confirmation = "REGISTER GSAM INSTITUTIONAL FOUNDATION";
const reference = "FW-GSAM-JV-2026-001";
const prefix = `gsam-http-${randomUUID()}`;
const secret = randomBytes(48).toString("hex");
const logSecret = randomBytes(48).toString("hex");

const client = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

const ids = {
  users: [],
  roles: [],
  permissions: [],
  sessions: [],
};

let temporary;
let server;
let output = "";
let succeeded = false;

function redact(value) {
  let text = String(value ?? "");
  for (const key of [dbUrl, secret, logSecret]) {
    text = text.split(key).join("[REDACTED]");
  }
  return text.replace(
    /postgres(?:ql)?:\/\/[^\s"'`]+/gi,
    "[REDACTED_CONNECTION]"
  );
}

async function assertEmpty() {
  const rows = await client.$queryRaw`
    SELECT current_database() AS db,
           host(inet_server_addr()) AS host,
           inet_server_port() AS port
  `;

  assert.deepEqual(
    [rows[0].db, rows[0].host, rows[0].port],
    [dbName, "127.0.0.1", 5432]
  );

  for (const model of [
    "user", "session", "role", "permission",
    "userRole", "rolePermission",
    "gsamInstitutionalParticipation",
  ]) {
    assert.equal(
      await client[model].count(),
      0,
      `STOP: ${model} is not empty`
    );
  }
}

async function assertPortFree() {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => {
      probe.close(resolve);
    });
  });
}

async function createUser(label, roleIds) {
  const record = await client.user.create({
    data: {
      username: `${prefix}-${label}`,
      email: `${prefix}-${label}@example.invalid`,
      passwordHash: "NOT_A_LOGIN_PASSWORD",
      displayName: "Synthetic GSAM Operator",
      viewedDocs: [],
      isAdmin: true,
    },
  });

  ids.users.push(record.id);

  for (const roleId of roleIds) {
    await client.userRole.create({
      data: { userId: record.id, roleId },
    });
  }

  return record;
}

async function createCookie(user) {
  const tokenId = randomUUID();

  const session = await client.session.create({
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
    tier: "operations",
    roles: [],
    displayName: "Synthetic GSAM Operator",
    popupMessage: "Acceptance",
    greeting: "Acceptance",
    partner: "AXPT",
    docs: [],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  return `axpt_session=${token}`;
}

function write(relative, content) {
  const destination = path.join(temporary, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

function prepareApplication() {
  temporary = fs.mkdtempSync(
    path.join(root, ".gsam-registration-http-")
  );

  for (const name of ["node_modules", "src"]) {
    fs.symlinkSync(
      path.join(root, name),
      path.join(temporary, name),
      "dir"
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
    "export default { experimental: { externalDir: true } };\n"
  );

  write(
    "app/layout.tsx",
    "export default function Layout({children}) " +
    "{return <html><body>{children}</body></html>;}\n"
  );

  const name = `app${route}/route.ts`;
  const destination = path.join(temporary, name);

  let relative = path.relative(
    path.dirname(destination),
    path.join(root, name)
  ).split(path.sep).join("/").replace(/\.ts$/, "");

  if (!relative.startsWith(".")) {
    relative = `./${relative}`;
  }

  write(
    name,
    `export { POST } from ${JSON.stringify(relative)};\n`
  );

  write(
    "app/api/acceptance-health/route.ts",
    'import {prisma} from "@/infrastructure/db/prisma";\n' +
    'export async function GET(){' +
    'const rows=await prisma.$queryRaw`SELECT current_database() AS db`;' +
    'return Response.json({db:rows[0].db});}\n'
  );
}

async function start(enabled) {
  assert.equal(server, undefined);

  const environment = {
    ...process.env,
    DATABASE_URL: dbUrl,
    DIRECT_URL: dbUrl,
    SIGNING_SECRET: secret,
    LOG_SECRET: logSecret,
    NODE_ENV: "development",
    GSAM_INSTITUTIONAL_REGISTRATION_ENABLED:
      enabled ? "enabled" : "disabled",
    RESEND_API_KEY: "re_local_inert_acceptance_key",
    BLOB_READ_WRITE_TOKEN: "",
  };

  output = "";

  server = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "dev",
      temporary,
      "--webpack",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: temporary,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  const capture = chunk => {
    output = (output + redact(chunk)).slice(-16000);
  };

  server.stdout.on("data", capture);
  server.stderr.on("data", capture);

  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null ||
        server.signalCode !== null) {
      throw Error("Acceptance server exited");
    }

    try {
      const response = await fetch(
        `${origin}/api/acceptance-health`,
        { signal: AbortSignal.timeout(3000) }
      );

      if (response.ok) {
        const body = await response.json();
        assert.equal(body.db, dbName);
        console.log(
          `✓ Isolated server ready; registration ${
            enabled ? "enabled" : "disabled"
          }`
        );
        return;
      }
    } catch (error) {
      if (error instanceof assert.AssertionError) throw error;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw Error("Acceptance server readiness timeout");
}

async function stop() {
  if (!server) return;

  const processToStop = server;
  server = undefined;

  if (processToStop.exitCode !== null ||
      processToStop.signalCode !== null) return;

  const exited = new Promise(resolve => {
    processToStop.once("exit", resolve);
  });

  processToStop.kill("SIGTERM");

  await Promise.race([
    exited,
    new Promise(resolve => setTimeout(resolve, 5000)),
  ]);

  if (processToStop.exitCode === null &&
      processToStop.signalCode === null) {
    processToStop.kill("SIGKILL");
    await exited;
  }
}

async function post({
  cookie,
  requestOrigin = origin,
  confirm = confirmation,
  body,
} = {}) {
  const headers = { Origin: requestOrigin };

  if (cookie) headers.Cookie = cookie;
  if (confirm !== null) {
    headers["x-gsam-confirm"] = confirm;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(origin + route, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
    signal: AbortSignal.timeout(60000),
  });

  const raw = await response.text();
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw Error(
      `Unexpected HTTP ${response.status}: ` +
      redact(raw.slice(0, 300))
    );
  }

  return { status: response.status, data };
}

async function expect(status, error, options) {
  const result = await post(options);

  assert.equal(
    result.status,
    status,
    JSON.stringify(result.data)
  );

  if (error) {
    assert.equal(result.data.ok, false);
    assert.equal(result.data.error, error);
  }

  return result.data;
}

async function cleanup() {
  await client.$transaction(async tx => {
    await tx.gsamInstitutionalParticipation.deleteMany({
      where: { reference },
    });
    await tx.session.deleteMany({
      where: { id: { in: ids.sessions } },
    });
    await tx.userRole.deleteMany({
      where: { userId: { in: ids.users } },
    });
    await tx.rolePermission.deleteMany({
      where: { roleId: { in: ids.roles } },
    });
    await tx.user.deleteMany({
      where: { id: { in: ids.users } },
    });
    await tx.role.deleteMany({
      where: { id: { in: ids.roles } },
    });
    await tx.permission.deleteMany({
      where: { id: { in: ids.permissions } },
    });
  });
}

async function main() {
  await assertEmpty();
  await assertPortFree();
  console.log("✓ Empty acceptance database and free port");

  const adminRole = await client.role.create({
    data: {
      key: "ADMIN_PLATFORM",
      label: "Synthetic Platform Administrator",
    },
  });
  ids.roles.push(adminRole.id);

  const manageRole = await client.role.create({
    data: {
      key: `${prefix}-MANAGEMENT`,
      label: "Synthetic Institutional Management",
    },
  });
  ids.roles.push(manageRole.id);

  const permission = await client.permission.create({
    data: {
      key: "INSTITUTIONAL_ACCESS_MANAGE",
      label: "Manage Institutional Access",
    },
  });
  ids.permissions.push(permission.id);

  await client.rolePermission.create({
    data: {
      roleId: manageRole.id,
      permissionId: permission.id,
    },
  });

  const authorized = await createUser(
    "authorized",
    [adminRole.id, manageRole.id]
  );

  const denied = await createUser(
    "denied",
    [adminRole.id]
  );

  const authorizedCookie = await createCookie(authorized);
  const deniedCookie = await createCookie(denied);

  prepareApplication();
  await start(false);

  await expect(401, "UNAUTHORIZED");
  await expect(403, "OPERATOR_PERMISSION_REQUIRED", {
    cookie: deniedCookie,
  });
  await expect(403, "REQUEST_ORIGIN_MISMATCH", {
    cookie: authorizedCookie,
    requestOrigin: "https://example.invalid",
  });
  await expect(400, "EXPLICIT_CONFIRMATION_REQUIRED", {
    cookie: authorizedCookie,
    confirm: null,
  });
  await expect(400, "REGISTRATION_BODY_NOT_ALLOWED", {
    cookie: authorizedCookie,
    body: { forged: true },
  });
  await expect(
    403,
    "GSAM_INSTITUTIONAL_REGISTRATION_DISABLED",
    { cookie: authorizedCookie }
  );

  assert.equal(
    await client.gsamInstitutionalParticipation.count(),
    0
  );

  console.log(
    "✓ Authentication, permission and request denials passed"
  );

  await stop();
  await assertPortFree();
  await start(true);

  const first = await expect(201, null, {
    cookie: authorizedCookie,
  });

  assert.equal(first.ok, true);
  assert.equal(first.created, true);
  assert.equal(first.reference, reference);
  assert.equal(first.documentationStatus, "PENDING_REVIEW");
  assert.equal(first.accessStatus, "NOT_PROVISIONED");

  for (const field of [
    "authorityGranted",
    "appointmentCreated",
    "resourceAccessGranted",
    "communicationsMembershipCreated",
  ]) {
    assert.equal(first[field], false);
  }

  const original = await client
    .gsamInstitutionalParticipation.findUniqueOrThrow({
      where: { reference },
    });

  assert.equal(original.createdByUserId, authorized.id);

  const retry = await expect(200, null, {
    cookie: authorizedCookie,
  });

  assert.equal(retry.created, false);
  assert.equal(
    await client.gsamInstitutionalParticipation.count(),
    1
  );

  const after = await client
    .gsamInstitutionalParticipation.findUniqueOrThrow({
      where: { reference },
    });

  assert.equal(after.id, original.id);
  assert.equal(
    after.updatedAt.getTime(),
    original.updatedAt.getTime()
  );

  await client.gsamInstitutionalParticipation.update({
    where: { reference },
    data: { representativeName: "SYNTHETIC_CONFLICT" },
  });

  await expect(409, "INSTITUTIONAL_REGISTRATION_CONFLICT", {
    cookie: authorizedCookie,
  });

  await client.gsamInstitutionalParticipation.update({
    where: { reference },
    data: { representativeName: original.representativeName },
  });

  for (const model of [
    "representativeProgramAppointment",
    "commercialUtilityPack",
    "institutionalAccessGrant",
    "communicationMember",
  ]) {
    assert.equal(
      await client[model].count(),
      0,
      `Unexpected ${model} records`
    );
  }

  console.log(
    "✓ 201 creation, 200 retry, 409 conflict"
  );
  console.log(
    "✓ No appointment, CUP, access grant or membership"
  );

  await stop();
  await cleanup();
  await assertEmpty();

  console.log("✓ Acceptance database restored to empty");
  console.log("GSAM_INSTITUTIONAL_REGISTRATION_HTTP_OK");
}

try {
  await main();
  succeeded = true;
} catch (error) {
  console.error(
    redact(error instanceof Error
      ? error.stack ?? error.message
      : error)
  );
  if (output) console.error(redact(output));
  process.exitCode = 1;
} finally {
  await stop();

  if (succeeded && temporary) {
    fs.rmSync(temporary, {
      recursive: true,
      force: true,
    });
  }

  await client.$disconnect();
}

if (!succeeded) {
  console.error(
    "STOP: Acceptance failed. Inspect synthetic records " +
    "and temporary runtime before retry."
  );
}
