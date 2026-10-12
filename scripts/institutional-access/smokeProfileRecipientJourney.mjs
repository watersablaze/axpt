import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import vm from "node:vm";
import { createRequire } from "node:module";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const root = process.cwd();
const database = "arp_permission_acceptance_20261012";
const container = JSON.parse(execFileSync(
  "docker", ["inspect", "axpt-postgres-local"], { encoding: "utf8" },
))[0];

assert.equal(container.State.Running, true);
assert.ok((container.NetworkSettings.Ports["5432/tcp"] || [])
  .some(binding => binding.HostPort === "5433"));

const settings = Object.fromEntries(container.Config.Env.map(entry => {
  const index = entry.indexOf("=");
  return [entry.slice(0, index), entry.slice(index + 1)];
}));
const user = settings.POSTGRES_USER || "postgres";
assert.ok(settings.POSTGRES_PASSWORD, "Local container password setting missing");

assert.equal(execFileSync("docker", [
  "exec", "axpt-postgres-local", "psql", "-X", "-U", user,
  "-d", database, "-At", "-v", "ON_ERROR_STOP=1",
  "-c", "SELECT current_database();",
], { encoding: "utf8" }).trim(), database);

const connection = new URL(`postgresql://127.0.0.1:5433/${database}`);
connection.username = user;
connection.password = settings.POSTGRES_PASSWORD;
connection.searchParams.set("schema", "public");

const signingSecret = randomBytes(48).toString("hex");
const environment = {
  ...process.env,
  DATABASE_URL: connection.href,
  DIRECT_URL: connection.href,
  SIGNING_SECRET: signingSecret,
  LOG_SECRET: randomBytes(48).toString("hex"),
  NODE_ENV: "development",
};
const prisma = new PrismaClient({
  datasources: { db: { url: connection.href } },
});
const prefix = `ia-http-${randomUUID()}`;
const emails = [];
const createdRoleIds = [];
let permissionId;
let createdPermission = false;
let temporary;
let server;
let serverOutput = "";
const port = 3098;
const base = `http://127.0.0.1:${port}`;

function redact(value) {
  let text = String(value ?? "");
  for (const secret of [
    connection.href, settings.POSTGRES_PASSWORD, signingSecret,
    environment.LOG_SECRET,
  ]) {
    if (secret) text = text.split(secret).join("[REDACTED]");
  }
  return text.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[REDACTED_CONNECTION]");
}

function write(relative, contents) {
  const filename = path.join(temporary, relative);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, contents);
}

function expose(relative, exports) {
  const target = path.join(temporary, relative);
  let source = path.relative(path.dirname(target), path.join(root, relative))
    .split(path.sep).join("/").replace(/\.tsx?$/, "");
  if (!source.startsWith(".")) source = "./" + source;
  write(relative,
    `export { ${exports} } from ${JSON.stringify(source)};\n` +
    (exports === "default" ? 'export const dynamic = "force-dynamic";\n' : ""));
}

async function stop() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  const stopped = new Promise(resolve => server.once("exit", resolve));
  server.kill("SIGTERM");
  await Promise.race([stopped, new Promise(resolve => setTimeout(resolve, 5000))]);
  if (server.exitCode === null && server.signalCode === null) {
    server.kill("SIGKILL");
    await stopped;
  }
}

async function jsonRequest(route, body, cookie) {
  const response = await fetch(base + route, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); }
  catch {
    throw new Error(`HTTP ${response.status}: non-JSON response at ${route}: ` +
      redact(text.slice(0, 250)));
  }
  return { response, data };
}

async function page(route, cookie) {
  const response = await fetch(base + route, {
    headers: cookie ? { Cookie: cookie } : {},
    signal: AbortSignal.timeout(60000),
    redirect: "manual",
  });
  const html = await response.text();
  assert.equal(response.status, 200, `${route}: HTTP ${response.status}`);
  return html;
}

async function requestAccess(label) {
  const email = `${prefix}-${label}@example.invalid`;
  emails.push(email);
  const result = await jsonRequest("/api/french-ward/profile/access-request", {
    requesterName: `${prefix} ${label}`,
    requesterEmail: ` ${email.toUpperCase()} `,
    institutionalAffiliation: "Synthetic HTTP acceptance",
    requesterCapacity: "Reviewer",
    purpose: "Isolated recipient journey",
    scope: "LOI_INTAKE_ACCESS",
    resourceReference: "FORGED",
    resourceVersion: 999,
    approved: true,
  });
  assert.equal(result.response.status, 201, JSON.stringify(result.data));
  const record = await prisma.institutionalAccessRequest.findUnique({
    where: { id: result.data.request.id },
  });
  assert.equal(record.requesterEmail, email);
  assert.equal(record.scope, "PROFILE_VIEW");
  assert.equal(record.resourceReference, "FW-PROFILE-2026-001");
  assert.equal(record.resourceVersion, 2);
  assert.equal(record.status, "PENDING");
  return record;
}

async function operatorCookie(operator) {
  const tokenId = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await prisma.session.create({
    data: {
      userId: operator.id, tokenId, status: "active",
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  const token = await new SignJWT({
    userId: operator.id, tokenId, email: operator.email,
    tier: "operations", displayName: "Synthetic Operator",
    roles: ["ADMIN_PLATFORM"], popupMessage: "Acceptance",
    greeting: "Acceptance", partner: "AXPT", docs: ["whitepaper"],
  }).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now).setExpirationTime(now + 3600)
    .sign(new TextEncoder().encode(signingSecret));
  return `axpt_session=${token}`;
}

function checkReturnPaths() {
  const source = fs.readFileSync(path.join(root, "app/(auth)/login/page.tsx"), "utf8");
  const helperStart = source.indexOf("function getSafeDestination()");
  const helperEnd = source.indexOf("export default function LoginPage", helperStart);
  const routingStart = source.indexOf("      const requestedDestination =");
  const routingEnd = source.indexOf("      router.replace(destination)", routingStart);
  assert.ok(helperStart >= 0 && helperEnd > helperStart);
  assert.ok(routingStart >= 0 && routingEnd > routingStart);
  const code = source.slice(helperStart, helperEnd) +
    "\nfunction resolveDestination(data) {\n" +
    source.slice(routingStart, routingEnd) +
    "\nreturn destination;\n}\nresolveDestination(data);";

  for (const audience of ["ADMIN", "REPRESENTATIVE", "INSTITUTIONAL_VISITOR"]) {
    assert.equal(vm.runInNewContext(code, {
      URLSearchParams,
      window: { location: { search: "?next=%2Ffrench-ward%2Fprofile" } },
      data: { audience },
    }), "/french-ward/profile");
  }
  for (const audience of ["ADMIN", "REPRESENTATIVE", "INSTITUTIONAL_VISITOR"]) {
    const expected = {
      ADMIN: "/admin/control-center",
      REPRESENTATIVE: "/representative",
      INSTITUTIONAL_VISITOR: "/french-ward",
    }[audience];
    assert.equal(vm.runInNewContext(code, {
      URLSearchParams,
      window: { location: { search: "?next=https%3A%2F%2Fexample.invalid" } },
      data: { audience },
    }), expected);
  }
  console.log("PASS: actual login routing code returns approved audiences to Profile and rejects external destinations.");
}

async function main() {
  try {
    checkReturnPaths();
    await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once("error", reject);
      probe.listen(port, "127.0.0.1", () => probe.close(resolve));
    });

    temporary = fs.mkdtempSync(path.join(root, ".ia-profile-http-"));
    for (const directory of ["node_modules", "src", "public"]) {
      fs.symlinkSync(path.join(root, directory), path.join(temporary, directory), "dir");
    }
    write("package.json", JSON.stringify({ private: true }));
    write("tsconfig.json", JSON.stringify({
      compilerOptions: {
        target: "ES2022", module: "ESNext", moduleResolution: "bundler",
        jsx: "react-jsx", esModuleInterop: true,
        baseUrl: ".", paths: { "@/*": ["src/*"] },
      },
    }));
    write("next.config.mjs", "export default { experimental: { externalDir: true } };\n");
    write("app/layout.tsx",
      "export default function Layout({children}) { return <html><body>{children}</body></html>; }\n");

    expose("app/french-ward/profile/page.tsx", "default");
    expose("app/admin/institutional-access/page.tsx", "default");
    expose("app/api/french-ward/profile/access-request/route.ts", "POST");
    expose("app/api/admin/institutional-access/decision/route.ts", "POST");
    expose("app/api/admin/institutional-access/revoke/route.ts", "POST");
    expose("app/api/auth/login/verify/route.ts", "POST");

    write("app/api/acceptance-health/route.ts", `
import { prisma } from "@/infrastructure/db/prisma";
export async function GET() {
  const rows = await prisma.$queryRaw\`SELECT current_database() AS database\`;
  return Response.json({ database: rows[0].database,
    host: new URL(process.env.DATABASE_URL).hostname });
}
`);
    server = spawn(process.execPath, [
      require.resolve("next/dist/bin/next"), "dev", temporary,
      "--webpack", "--hostname", "127.0.0.1", "--port", String(port),
    ], { cwd: temporary, env: environment, stdio: ["ignore", "pipe", "pipe"] });
    const capture = chunk => {
      serverOutput = (serverOutput + redact(chunk.toString())).slice(-18000);
    };
    server.stdout.on("data", capture);
    server.stderr.on("data", capture);
    server.on("error", error => capture(error.message));

    let ready = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      if (server.exitCode !== null || server.signalCode !== null) {
        throw new Error("Acceptance server exited");
      }
      try {
        const response = await fetch(base + "/api/acceptance-health", {
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          const identity = await response.json();
          assert.equal(identity.database, database);
          assert.equal(identity.host, "127.0.0.1");
          ready = true;
          break;
        }
      } catch (error) {
        if (error instanceof assert.AssertionError) throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    assert.ok(ready, "Acceptance server readiness timed out");
    console.log("HTTP server isolated database identity verified.");

    let permission = await prisma.permission.findUnique({
      where: { key: "INSTITUTIONAL_ACCESS_MANAGE" },
    });
    if (!permission) {
      permission = await prisma.permission.create({
        data: { key: "INSTITUTIONAL_ACCESS_MANAGE", label: "Manage Institutional Access" },
      });
      createdPermission = true;
    }
    permissionId = permission.id;

    let adminRole = await prisma.role.findUnique({ where: { key: "ADMIN_PLATFORM" } });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { key: "ADMIN_PLATFORM", label: "Platform Administrator" },
      });
      createdRoleIds.push(adminRole.id);
    }
    const accessRole = await prisma.role.create({
      data: { key: `${prefix}-role`, label: "Synthetic access operator" },
    });
    createdRoleIds.push(accessRole.id);
    await prisma.rolePermission.create({
      data: { roleId: accessRole.id, permissionId },
    });
    const operatorEmail = `${prefix}-operator@example.invalid`;
    emails.push(operatorEmail);
    const operator = await prisma.user.create({
      data: {
        username: `${prefix}-operator`, email: operatorEmail,
        passwordHash: "INERT_ACCEPTANCE_FIXTURE",
        displayName: "Synthetic Operator", viewedDocs: [],
      },
    });
    for (const roleId of [adminRole.id, accessRole.id]) {
      await prisma.userRole.create({ data: { userId: operator.id, roleId } });
    }
    const adminCookie = await operatorCookie(operator);

    const anonymous = await page("/french-ward/profile");
    assert.match(anonymous, /data-fw-profile-request/);
    assert.ok(!anonymous.includes("Official institutional publication"));

    const record = await requestAccess("recipient");
    assert.equal(await prisma.user.count({ where: { email: record.requesterEmail } }), 0);
    const inspector = await page("/admin/institutional-access", adminCookie);
    assert.ok(inspector.includes(record.requesterName));

    const payload = {
      requestId: record.id, decision: "APPROVED",
      reason: "Synthetic HTTP approval",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      recipientUserId: operator.id,
      resourceVersion: 999,
    };
    const unauthenticated = await jsonRequest(
      "/api/admin/institutional-access/decision", payload,
    );
    assert.equal(unauthenticated.response.status, 401);

    const approval = await jsonRequest(
      "/api/admin/institutional-access/decision", payload, adminCookie,
    );
    assert.equal(approval.response.status, 200, JSON.stringify(approval.data));
    assert.equal(approval.data.result.notificationSent, false);
    const recipient = await prisma.user.findUnique({
      where: { email: record.requesterEmail },
    });
    assert.ok(recipient);
    const grant = await prisma.institutionalAccessGrant.findUnique({
      where: { requestId: record.id },
    });
    assert.equal(grant.recipientUserId, recipient.id);
    assert.notEqual(grant.recipientUserId, operator.id);
    assert.equal(grant.resourceVersion, 2);
    console.log("PASS: public request, operator inspector and authenticated approval provision the correctly bound recipient.");

    const pin = "637291";
    await prisma.pinLoginRequest.create({
      data: {
        email: recipient.email, pinHash: await bcrypt.hash(pin, 12),
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const login = await jsonRequest("/api/auth/login/verify", {
      email: recipient.email, pin,
    });
    assert.equal(login.response.status, 200, JSON.stringify(login.data));
    assert.equal(login.data.audience, "INSTITUTIONAL_VISITOR");
    const cookies = login.response.headers.getSetCookie?.() ||
      [login.response.headers.get("set-cookie") || ""];
    const cookie = cookies.find(value => value.startsWith("axpt_session="));
    assert.ok(cookie);
    assert.match(cookie, /HttpOnly/i);
    const recipientCookie = cookie.split(";")[0];
    const token = decodeURIComponent(recipientCookie.slice("axpt_session=".length));
    const { payload: sessionPayload } = await jwtVerify(
      token, new TextEncoder().encode(signingSecret), { algorithms: ["HS256"] },
    );
    assert.equal(sessionPayload.userId, recipient.id);
    assert.equal(sessionPayload.tier, "institutional-visitor");
    assert.ok(await prisma.session.findUnique({
      where: { tokenId: sessionPayload.tokenId },
    }));

    const publication = await page("/french-ward/profile", recipientCookie);
    assert.ok(publication.includes("Official institutional publication"));
    assert.ok(!publication.includes("data-fw-profile-request"));

    const replay = await jsonRequest("/api/auth/login/verify", {
      email: recipient.email, pin,
    });
    assert.equal(replay.response.status, 401);
    const unauthorized = await jsonRequest(
      "/api/admin/institutional-access/decision", payload, recipientCookie,
    );
    assert.equal(unauthorized.response.status, 403);
    console.log("PASS: newly provisioned recipient PIN/session opens edition 2; PIN replay and recipient operator actions are denied.");

    await prisma.institutionalAccessGrant.update({
      where: { id: grant.id }, data: { expiresAt: new Date(Date.now() - 1000) },
    });
    assert.match(await page("/french-ward/profile", recipientCookie),
      /data-fw-profile-request/);
    await prisma.institutionalAccessGrant.update({
      where: { id: grant.id }, data: { expiresAt: new Date(Date.now() + 3600000) },
    });

    const revocation = await jsonRequest(
      "/api/admin/institutional-access/revoke",
      { grantId: grant.id, reason: "Synthetic HTTP revocation" },
      adminCookie,
    );
    assert.equal(revocation.response.status, 200, JSON.stringify(revocation.data));
    assert.match(await page("/french-ward/profile", recipientCookie),
      /data-fw-profile-request/);
    assert.equal(await prisma.institutionalAccessEvent.count({
      where: { requestId: record.id, type: "REVOKED" },
    }), 1);

    const declined = await requestAccess("declined");
    const decline = await jsonRequest(
      "/api/admin/institutional-access/decision",
      { requestId: declined.id, decision: "DECLINED", reason: "Synthetic decline" },
      adminCookie,
    );
    assert.equal(decline.response.status, 200, JSON.stringify(decline.data));
    assert.equal(await prisma.user.count({
      where: { email: declined.requesterEmail },
    }), 0);
    console.log("PASS: expiry and HTTP revocation block publication through the existing session; decline creates no recipient account.");
  } catch (error) {
    console.error(redact(error.message));
    if (serverOutput) console.error(serverOutput);
    process.exitCode = 1;
  } finally {
    await stop();
    try {
      await prisma.$transaction(async tx => {
        const requests = await tx.institutionalAccessRequest.findMany({
          where: { requesterEmail: { in: emails } }, select: { id: true },
        });
        const requestIds = requests.map(record => record.id);
        const users = await tx.user.findMany({
          where: { email: { in: emails } }, select: { id: true },
        });
        const userIds = users.map(record => record.id);
        await tx.institutionalAccessEvent.deleteMany({
          where: { requestId: { in: requestIds } },
        });
        await tx.institutionalAccessGrant.deleteMany({
          where: { requestId: { in: requestIds } },
        });
        await tx.institutionalAccessRequest.deleteMany({
          where: { id: { in: requestIds } },
        });
        await tx.pinLoginRequest.deleteMany({ where: { email: { in: emails } } });
        await tx.session.deleteMany({ where: { userId: { in: userIds } } });
        await tx.userRole.deleteMany({ where: { userId: { in: userIds } } });
        await tx.rolePermission.deleteMany({ where: { roleId: { in: createdRoleIds } } });
        await tx.role.deleteMany({ where: { id: { in: createdRoleIds } } });
        if (createdPermission) {
          await tx.permission.delete({ where: { id: permissionId } });
        }
        await tx.user.deleteMany({ where: { id: { in: userIds } } });
      }, { timeout: 30000 });
      console.log("HTTP acceptance fixtures removed.");
    } catch (error) {
      console.error("Fixture cleanup failed:", redact(error.message));
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
      if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
    }
  }
}

await main();
