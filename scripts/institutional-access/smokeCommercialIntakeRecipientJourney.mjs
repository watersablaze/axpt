import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { SignJWT, decodeJwt } from "jose";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const root = process.cwd();

assert.ok(process.env.DATABASE_URL, "DATABASE_URL required");

const prisma = new PrismaClient();
const prefix = `loi-http-${randomUUID()}`;
const recipientEmail = `${prefix}-recipient@example.invalid`;

const signingSecret = randomBytes(48).toString("hex");
const logSecret = randomBytes(48).toString("hex");

const port = 3099;
const base = `http://127.0.0.1:${port}`;

let temporary;
let server;
let serverOutput = "";

const createdTokenIds = [];

function redact(value) {
  let text = String(value ?? "");

  for (const secret of [
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.DIRECT_URL,
    signingSecret,
    logSecret,
  ]) {
    if (secret) {
      text = text.split(secret).join("[REDACTED]");
    }
  }

  return text.replace(
    /postgres(?:ql)?:\/\/[^\s"'`]+/gi,
    "[REDACTED_CONNECTION]",
  );
}

function write(relative, contents) {
  const filename = path.join(temporary, relative);

  fs.mkdirSync(
    path.dirname(filename),
    { recursive: true },
  );

  fs.writeFileSync(filename, contents);
}

function expose(relative, exports) {
  const target = path.join(temporary, relative);

  let source = path
    .relative(
      path.dirname(target),
      path.join(root, relative),
    )
    .split(path.sep)
    .join("/")
    .replace(/\.tsx?$/, "");

  if (!source.startsWith(".")) {
    source = "./" + source;
  }

  write(
    relative,
    `export { ${exports} } from ${JSON.stringify(source)};\n` +
      (exports === "default"
        ? 'export const dynamic = "force-dynamic";\n'
        : ""),
  );
}

async function stop() {
  if (
    !server ||
    server.exitCode !== null ||
    server.signalCode !== null
  ) {
    return;
  }

  const stopped = new Promise((resolve) =>
    server.once("exit", resolve),
  );

  server.kill("SIGTERM");

  await Promise.race([
    stopped,
    new Promise((resolve) =>
      setTimeout(resolve, 5000),
    ),
  ]);

  if (
    server.exitCode === null &&
    server.signalCode === null
  ) {
    server.kill("SIGKILL");
    await stopped;
  }

  server = undefined;
}

async function startServer({ failingDelivery = false } = {}) {
  await stop();

  if (failingDelivery) {
    const sourceFile = path.join(
      root,
      "app/api/transaction-intake/route.ts",
    );

    let source = fs.readFileSync(
      sourceFile,
      "utf8",
    );

    source = source.replace(
      'import { sendTransactionIntakeConfirmation } from "@/domains/control-center/transaction-intakes/sendTransactionIntakeConfirmation";',
      'import { sendTransactionIntakeConfirmation } from "./acceptanceDeliveryFailure";',
    );

    source = source.replace(
      'import { sendTransactionIntakeInternalNotification } from "@/domains/control-center/transaction-intakes/sendTransactionIntakeInternalNotification";',
      'import { sendTransactionIntakeInternalNotification } from "./acceptanceDeliveryFailure";',
    );

    assert.match(
      source,
      /acceptanceDeliveryFailure/,
    );

    write(
      "app/api/transaction-intake/route.ts",
      source,
    );

    write(
      "app/api/transaction-intake/acceptanceDeliveryFailure.ts",
      `
export async function sendTransactionIntakeConfirmation() {
  throw new Error("ACCEPTANCE_CONFIRMATION_DELIVERY_FAILURE");
}

export async function sendTransactionIntakeInternalNotification() {
  throw new Error("ACCEPTANCE_INTERNAL_DELIVERY_FAILURE");
}
`,
    );
  } else {
    expose(
      "app/api/transaction-intake/route.ts",
      "POST",
    );

    fs.rmSync(
      path.join(
        temporary,
        "app/api/transaction-intake/acceptanceDeliveryFailure.ts",
      ),
      { force: true },
    );
  }

  serverOutput = "";

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
      env: {
        ...process.env,
        SIGNING_SECRET: signingSecret,
        LOG_SECRET: logSecret,
        NODE_ENV: "development",
        TRANSACTION_INTAKE_EMAIL_MODE: "log",
        TRANSACTION_INTAKE_ADMIN_EMAILS:
          "loi-http@example.invalid",
        NEXT_PUBLIC_SITE_URL: base,
      },
      stdio: [
        "ignore",
        "pipe",
        "pipe",
      ],
    },
  );

  const capture = (chunk) => {
    serverOutput = (
      serverOutput +
      redact(chunk.toString())
    ).slice(-24000);
  };

  server.stdout.on("data", capture);
  server.stderr.on("data", capture);
  server.on(
    "error",
    (error) => capture(error.message),
  );

  let ready = false;

  for (
    let attempt = 0;
    attempt < 90;
    attempt++
  ) {
    if (
      server.exitCode !== null ||
      server.signalCode !== null
    ) {
      throw new Error(
        `Acceptance server exited.\n${serverOutput}`,
      );
    }

    try {
      const response = await fetch(
        base +
          "/french-ward/transaction-intake",
        {
          signal:
            AbortSignal.timeout(3000),
        },
      );

      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Retry until ready.
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 1000),
    );
  }

  assert.ok(
    ready,
    `Acceptance server readiness timed out.\n${serverOutput}`,
  );
}

async function post(
  route,
  body,
  cookie,
) {
  const response = await fetch(
    base + route,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        ...(cookie
          ? { Cookie: cookie }
          : {}),
      },
      body: JSON.stringify(body),
      signal:
        AbortSignal.timeout(60000),
    },
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `${route} HTTP ${response.status}: ` +
        redact(text.slice(0, 350)),
    );
  }

  return { response, data };
}

async function page(
  route,
  cookie,
) {
  const response = await fetch(
    base + route,
    {
      headers:
        cookie
          ? { Cookie: cookie }
          : {},
      redirect: "manual",
      signal:
        AbortSignal.timeout(60000),
    },
  );

  const html = await response.text();

  assert.equal(
    response.status,
    200,
    `${route}: HTTP ${response.status}`,
  );

  return html;
}

function checkReturnPath() {
  const source = fs.readFileSync(
    path.join(
      root,
      "app/(auth)/login/page.tsx",
    ),
    "utf8",
  );

  const helperStart = source.indexOf(
    "function getSafeDestination()",
  );

  const helperEnd = source.indexOf(
    "export default function LoginPage",
    helperStart,
  );

  const routingStart = source.indexOf(
    "      const requestedDestination =",
  );

  const routingEnd = source.indexOf(
    "      router.replace(destination)",
    routingStart,
  );

  assert.ok(
    helperStart >= 0 &&
      helperEnd > helperStart,
  );

  assert.ok(
    routingStart >= 0 &&
      routingEnd > routingStart,
  );

  const code =
    source.slice(
      helperStart,
      helperEnd,
    ) +
    `
function resolveDestination(data) {
${source.slice(
  routingStart,
  routingEnd,
)}
return destination;
}
resolveDestination(data);
`;

  const destination = vm.runInNewContext(
    code,
    {
      URLSearchParams,
      window: {
        location: {
          search:
            "?next=%2Ffrench-ward%2Ftransaction-intake",
        },
      },
      data: {
        audience:
          "INSTITUTIONAL_VISITOR",
      },
    },
  );

  assert.equal(
    destination,
    "/french-ward/transaction-intake",
  );
}

async function makeAdminCookie() {
  const user = await prisma.user.findUnique({
    where: {
      email: "connect@axpt.io",
    },
    include: {
      userRoles: {
        where: {
          isActive: true,
          revokedAt: null,
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  assert.ok(user);

  const roles = user.userRoles.map(
    (row) => row.role.key,
  );

  const permissions =
    user.userRoles.flatMap(
      (row) =>
        row.role.rolePermissions.map(
          (binding) =>
            binding.permission.key,
        ),
    );

  assert.ok(
    roles.includes(
      "ADMIN_PLATFORM",
    ),
  );

  assert.ok(
    permissions.includes(
      "INSTITUTIONAL_ACCESS_MANAGE",
    ),
  );

  const tokenId = randomUUID();
  createdTokenIds.push(tokenId);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenId,
      status: "active",
      expiresAt:
        new Date(
          Date.now() + 3600000,
        ),
    },
  });

  const now =
    Math.floor(
      Date.now() / 1000,
    );

  const token =
    await new SignJWT({
      userId: user.id,
      tokenId,
      email: user.email,
      tier: "operations",
      roles,
      displayName:
        user.displayName ??
        "AXPT Operator",
      popupMessage:
        "Acceptance",
      greeting:
        "Acceptance",
      partner:
        "AXPT",
      docs:
        ["whitepaper"],
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt(now)
      .setExpirationTime(
        now + 3600,
      )
      .sign(
        new TextEncoder()
          .encode(signingSecret),
      );

  return (
    "axpt_session=" +
    encodeURIComponent(token)
  );
}

async function makeRecipientSession(
  recipient,
) {
  const pin = "637291";

  await prisma.pinLoginRequest.upsert({
    where: {
      email:
        recipient.email,
    },
    create: {
      email:
        recipient.email,
      pinHash:
        await bcrypt.hash(
          pin,
          12,
        ),
      attemptCount:
        0,
      expiresAt:
        new Date(
          Date.now() + 600000,
        ),
      consumedAt:
        null,
    },
    update: {
      pinHash:
        await bcrypt.hash(
          pin,
          12,
        ),
      attemptCount:
        0,
      expiresAt:
        new Date(
          Date.now() + 600000,
        ),
      consumedAt:
        null,
    },
  });

  const login = await post(
    "/api/auth/login/verify",
    {
      email:
        recipient.email,
      pin,
    },
  );

  assert.equal(
    login.response.status,
    200,
    JSON.stringify(login.data),
  );

  assert.equal(
    login.data.audience,
    "INSTITUTIONAL_VISITOR",
  );

  const values =
    login.response.headers
      .getSetCookie?.() ??
    [
      login.response.headers.get(
        "set-cookie",
      ) ?? "",
    ];

  const cookie =
    values.find(
      (value) =>
        value.startsWith(
          "axpt_session=",
        ),
    );

  assert.ok(cookie);

  const recipientCookie =
    cookie.split(";")[0];

  const token =
    decodeURIComponent(
      recipientCookie.slice(
        "axpt_session=".length,
      ),
    );

  createdTokenIds.push(
    decodeJwt(token).tokenId,
  );

  return recipientCookie;
}

function intakePayload(
  email,
  suffix,
) {
  return {
    submitterName:
      `Synthetic LOI ${suffix}`,
    submitterEmail:
      email,
    submitterRole:
      "Buyer Representative",
    program:
      "French-Ward Gold",
    transactionType:
      "Trial Purchase",
    commodity:
      "Gold Doré",
    quantity:
      "1 KG",
    origin:
      "Acceptance Fixture",
    destination:
      "Acceptance Fixture",
    declarationAccuracy:
      true,
    declarationNoObligation:
      true,
    declarationNoCommission:
      true,
    sourceUrl:
      `${base}/french-ward/transaction-intake`,
  };
}

async function assertDeniedWithoutIntake(
  cookie,
  label,
) {
  const before =
    await prisma
      .transactionIntake
      .count();

  const result =
    await post(
      "/api/transaction-intake",
      intakePayload(
        recipientEmail,
        label,
      ),
      cookie,
    );

  assert.equal(
    result.response.status,
    403,
    `${label}: ${JSON.stringify(
      result.data,
    )}`,
  );

  assert.equal(
    await prisma
      .transactionIntake
      .count(),
    before,
    `${label}: intake was created`,
  );
}

async function cleanup() {
  const requests =
    await prisma
      .institutionalAccessRequest
      .findMany({
        where: {
          requesterEmail: {
            startsWith:
              prefix,
          },
        },
        select: {
          id: true,
        },
      });

  const requestIds =
    requests.map(
      (row) => row.id,
    );

  const users =
    await prisma.user.findMany({
      where: {
        email: {
          startsWith:
            prefix,
        },
      },
      select: {
        id: true,
      },
    });

  const userIds =
    users.map(
      (row) => row.id,
    );

  const intakes =
    await prisma
      .transactionIntake
      .findMany({
        where: {
          submitterEmail: {
            startsWith:
              prefix,
          },
        },
        select: {
          id: true,
          reference: true,
        },
      });

  const intakeIds =
    intakes.map(
      (row) => row.id,
    );

  await prisma.$transaction(
    async (tx) => {
      if (
        intakeIds.length
      ) {
        await tx
          .transactionIntakeEvent
          .deleteMany({
            where: {
              intakeId: {
                in:
                  intakeIds,
              },
            },
          });

        await tx
          .transactionIntake
          .deleteMany({
            where: {
              id: {
                in:
                  intakeIds,
              },
            },
          });
      }

      if (
        requestIds.length
      ) {
        await tx
          .institutionalAccessEvent
          .deleteMany({
            where: {
              requestId: {
                in:
                  requestIds,
              },
            },
          });

        await tx
          .institutionalAccessGrant
          .deleteMany({
            where: {
              requestId: {
                in:
                  requestIds,
              },
            },
          });

        await tx
          .institutionalAccessRequest
          .deleteMany({
            where: {
              id: {
                in:
                  requestIds,
              },
            },
          });
      }

      await tx
        .pinLoginRequest
        .deleteMany({
          where: {
            email: {
              startsWith:
                prefix,
            },
          },
        });

      if (
        createdTokenIds.length
      ) {
        await tx.session.deleteMany({
          where: {
            tokenId: {
              in:
                createdTokenIds,
            },
          },
        });
      }

      if (
        userIds.length
      ) {
        await tx.session.deleteMany({
          where: {
            userId: {
              in:
                userIds,
            },
          },
        });

        await tx.userRole.deleteMany({
          where: {
            userId: {
              in:
                userIds,
            },
          },
        });

        await tx.user.deleteMany({
          where: {
            id: {
              in:
                userIds,
            },
          },
        });
      }

      for (
        const intake
        of intakes
      ) {
        await tx.emailLog.deleteMany({
          where: {
            subject: {
              contains:
                intake.reference,
            },
          },
        });
      }
    },
    {
      timeout:
        30000,
    },
  );
}

async function main() {
  const baseline = {
    requests:
      await prisma
        .institutionalAccessRequest
        .count(),
    grants:
      await prisma
        .institutionalAccessGrant
        .count(),
    events:
      await prisma
        .institutionalAccessEvent
        .count(),
    intakes:
      await prisma
        .transactionIntake
        .count(),
  };

  try {
    checkReturnPath();

    const jens =
      await prisma.user.findUnique({
        where: {
          email:
            "juxtaport@gmail.com",
        },
      });

    assert.equal(
      jens?.id,
      "cmuu6dewt0000w0jsnim9uzhg",
    );

    console.log(
      "PASS: Jens-bearing durable database confirmed.",
    );

    temporary =
      fs.mkdtempSync(
        path.join(
          root,
          ".ia-loi-http-",
        ),
      );

    for (
      const directory
      of [
        "node_modules",
        "src",
        "public",
        "lib",
      ]
    ) {
      const source =
        path.join(
          root,
          directory,
        );

      if (
        fs.existsSync(source)
      ) {
        fs.symlinkSync(
          source,
          path.join(
            temporary,
            directory,
          ),
          "dir",
        );
      }
    }

    write(
      "package.json",
      JSON.stringify({
        private: true,
      }),
    );

    write(
      "tsconfig.json",
      JSON.stringify({
        compilerOptions: {
          target:
            "ES2022",
          module:
            "ESNext",
          moduleResolution:
            "bundler",
          jsx:
            "react-jsx",
          esModuleInterop:
            true,
          baseUrl:
            ".",
          paths: {
            "@/*":
              ["src/*"],
          },
        },
      }),
    );

    write(
      "next.config.mjs",
      "export default { experimental: { externalDir: true } };\n",
    );

    write(
      "app/layout.tsx",
      "export default function Layout({children}) { return <html><body>{children}</body></html>; }\n",
    );

    expose(
      "app/french-ward/transaction-intake/page.tsx",
      "default, metadata",
    );

    expose(
      "app/admin/institutional-access/page.tsx",
      "default",
    );

    expose(
      "app/api/french-ward/transaction-intake/access-request/route.ts",
      "POST",
    );

    expose(
      "app/api/admin/institutional-access/decision/route.ts",
      "POST",
    );

    expose(
      "app/api/admin/institutional-access/revoke/route.ts",
      "POST",
    );

    expose(
      "app/api/auth/login/verify/route.ts",
      "POST",
    );

    await new Promise(
      (resolve, reject) => {
        const probe =
          net.createServer();

        probe.once(
          "error",
          reject,
        );

        probe.listen(
          port,
          "127.0.0.1",
          () =>
            probe.close(
              resolve,
            ),
        );
      },
    );

    await startServer();

    const adminCookie =
      await makeAdminCookie();

    /*
     * REQUEST
     */
    const requested =
      await post(
        "/api/french-ward/transaction-intake/access-request",
        {
          requesterName:
            "Synthetic LOI Recipient",
          requesterEmail:
            recipientEmail.toUpperCase(),
          institutionalAffiliation:
            "Acceptance Fixture",
          requesterCapacity:
            "Buyer Representative",
          purpose:
            "Commercial intake acceptance",
          scope:
            "PROFILE_VIEW",
          resourceReference:
            "FORGED",
          resourceVersion:
            999,
        },
      );

    assert.equal(
      requested.response.status,
      201,
      JSON.stringify(
        requested.data,
      ),
    );

    const request =
      await prisma
        .institutionalAccessRequest
        .findUnique({
          where: {
            id:
              requested.data
                .request.id,
          },
        });

    assert.ok(request);

    assert.equal(
      request.scope,
      "LOI_INTAKE_ACCESS",
    );

    assert.equal(
      request.resourceReference,
      "french-ward:commercial-intake:v1",
    );

    assert.equal(
      request.resourceVersion,
      1,
    );

    console.log(
      "PASS: public request bound to canonical LOI v1.",
    );

    /*
     * APPROVAL
     */
    const approved =
      await post(
        "/api/admin/institutional-access/decision",
        {
          requestId:
            request.id,
          decision:
            "APPROVED",
          reason:
            "Synthetic acceptance",
          expiresAt:
            new Date(
              Date.now() +
                3600000,
            ).toISOString(),

          /*
           * Deliberately forged.
           * Consumer must use persisted coordinates.
           */
          resourceVersion:
            999,
        },
        adminCookie,
      );

    assert.equal(
      approved.response.status,
      200,
      JSON.stringify(
        approved.data,
      ),
    );

    assert.equal(
      approved.data.result
        .recipientSignInUrl,
      "/login?next=%2Ffrench-ward%2Ftransaction-intake",
    );

    const recipient =
      await prisma.user.findUnique({
        where: {
          email:
            recipientEmail,
        },
      });

    assert.ok(recipient);

    const grant =
      await prisma
        .institutionalAccessGrant
        .findUnique({
          where: {
            requestId:
              request.id,
          },
        });

    assert.ok(grant);

    assert.equal(
      grant.recipientUserId,
      recipient.id,
    );

    assert.equal(
      grant.scope,
      "LOI_INTAKE_ACCESS",
    );

    assert.equal(
      grant.resourceVersion,
      1,
    );

    console.log(
      "PASS: Admin approval provisions exact recipient/grant.",
    );

    /*
     * PIN + FORM
     */
    const recipientCookie =
      await makeRecipientSession(
        recipient,
      );

    const formHtml =
      await page(
        "/french-ward/transaction-intake",
        recipientCookie,
      );

    assert.match(
      formHtml,
      /Letter of Intent/,
    );

    assert.match(
      formHtml,
      /name="submitterName"/,
    );

    console.log(
      "PASS: PIN session opens protected LOI form.",
    );

    /*
     * MISSING SESSION
     */
    await assertDeniedWithoutIntake(
      undefined,
      "missing-session",
    );

    /*
     * EXPIRED GRANT
     */
    await prisma
      .institutionalAccessGrant
      .update({
        where: {
          id: grant.id,
        },
        data: {
          expiresAt:
            new Date(
              Date.now() - 1000,
            ),
        },
      });

    await assertDeniedWithoutIntake(
      recipientCookie,
      "expired",
    );

    await prisma
      .institutionalAccessGrant
      .update({
        where: {
          id: grant.id,
        },
        data: {
          expiresAt:
            new Date(
              Date.now() +
                3600000,
            ),
        },
      });

    /*
     * WRONG IDENTITY
     */
    await prisma
      .institutionalAccessGrant
      .update({
        where: {
          id: grant.id,
        },
        data: {
          recipientEmail:
            `${prefix}-wrong@example.invalid`,
        },
      });

    await assertDeniedWithoutIntake(
      recipientCookie,
      "wrong-identity",
    );

    await prisma
      .institutionalAccessGrant
      .update({
        where: {
          id: grant.id,
        },
        data: {
          recipientEmail:
            recipientEmail,
        },
      });

    /*
     * WRONG EDITION
     */
    await prisma
      .institutionalAccessGrant
      .update({
        where: {
          id: grant.id,
        },
        data: {
          resourceVersion:
            999,
        },
      });

    await assertDeniedWithoutIntake(
      recipientCookie,
      "wrong-edition",
    );

    await prisma
      .institutionalAccessGrant
      .update({
        where: {
          id: grant.id,
        },
        data: {
          resourceVersion:
            1,
        },
      });

    console.log(
      "PASS: missing session, expired grant, wrong identity and wrong edition create no intake.",
    );

    /*
     * SUCCESS
     */
    const successful =
      await post(
        "/api/transaction-intake",
        intakePayload(
          recipientEmail,
          "valid",
        ),
        recipientCookie,
      );

    assert.equal(
      successful.response.status,
      200,
      JSON.stringify(
        successful.data,
      ),
    );

    const intake =
      await prisma
        .transactionIntake
        .findUnique({
          where: {
            id:
              successful.data
                .intake.id,
          },
        });

    assert.ok(intake);

    const submittedEvent =
      await prisma
        .institutionalAccessEvent
        .findFirst({
          where: {
            requestId:
              request.id,
            grantId:
              grant.id,
            type:
              "INTAKE_SUBMITTED",
          },
          orderBy: {
            occurredAt:
              "desc",
          },
        });

    assert.ok(
      submittedEvent,
    );

    assert.equal(
      submittedEvent
        .metadata
        ?.intakeId,
      intake.id,
    );

    const logs =
      await prisma.emailLog.findMany({
        where: {
          subject: {
            contains:
              intake.reference,
          },
        },
      });

    assert.equal(
      logs.length,
      2,
    );

    assert.ok(
      logs.every(
        (row) =>
          row.status ===
          "LOGGED_ONLY",
      ),
    );

    console.log(
      "PASS: intake + INTAKE_SUBMITTED commit atomically; post-commit delivery executes.",
    );

    /*
     * FORCED POST-COMMIT DELIVERY FAILURE.
     *
     * Use the production route source with only its two delivery
     * dependencies replaced by throwing acceptance stubs.
     */
    await startServer({
      failingDelivery:
        true,
    });

    const beforeFailure =
      await prisma
        .transactionIntake
        .count();

    const failureResult =
      await post(
        "/api/transaction-intake",
        intakePayload(
          recipientEmail,
          "delivery-failure",
        ),
        recipientCookie,
      );

    assert.equal(
      failureResult.response.status,
      200,
      JSON.stringify(
        failureResult.data,
      ),
    );

    const afterFailure =
      await prisma
        .transactionIntake
        .count();

    assert.equal(
      afterFailure,
      beforeFailure + 1,
    );

    const failureIntake =
      await prisma
        .transactionIntake
        .findUnique({
          where: {
            id:
              failureResult.data
                .intake.id,
          },
        });

    assert.ok(
      failureIntake,
    );

    const failureAudit =
      await prisma
        .institutionalAccessEvent
        .findFirst({
          where: {
            grantId:
              grant.id,
            type:
              "INTAKE_SUBMITTED",
            metadata: {
              path: [
                "intakeId",
              ],
              equals:
                failureIntake.id,
            },
          },
        });

    assert.ok(
      failureAudit,
    );

    assert.match(
      serverOutput,
      /ACCEPTANCE_CONFIRMATION_DELIVERY_FAILURE/,
    );

    assert.match(
      serverOutput,
      /ACCEPTANCE_INTERNAL_DELIVERY_FAILURE/,
    );

    console.log(
      "PASS: forced delivery exceptions occur after commit and do not roll back intake/audit.",
    );

    /*
     * Restore production route before revocation.
     */
    await startServer();

    /*
     * REVOCATION
     */
    const revoked =
      await post(
        "/api/admin/institutional-access/revoke",
        {
          grantId:
            grant.id,
          reason:
            "Synthetic acceptance revocation",
        },
        adminCookie,
      );

    assert.equal(
      revoked.response.status,
      200,
      JSON.stringify(
        revoked.data,
      ),
    );

    await assertDeniedWithoutIntake(
      recipientCookie,
      "revoked",
    );

    console.log(
      "PASS: revoked grant blocks subsequent intake mutation.",
    );

    console.log(
      "COMMERCIAL_INTAKE_HTTP_ACCEPTANCE_OK",
    );
  } catch (error) {
    console.error(
      redact(
        error?.stack ??
          error?.message ??
          error,
      ),
    );

    if (serverOutput) {
      console.error(
        serverOutput,
      );
    }

    process.exitCode = 1;
  } finally {
    await stop();

    try {
      await cleanup();

      const restored = {
        requests:
          await prisma
            .institutionalAccessRequest
            .count(),
        grants:
          await prisma
            .institutionalAccessGrant
            .count(),
        events:
          await prisma
            .institutionalAccessEvent
            .count(),
        intakes:
          await prisma
            .transactionIntake
            .count(),
      };

      assert.deepEqual(
        restored,
        baseline,
      );

      assert.equal(
        await prisma.user.count({
          where: {
            email: {
              startsWith:
                prefix,
            },
          },
        }),
        0,
      );

      console.log(
        "PASS: disposable acceptance fixtures removed and baseline restored.",
      );
    } catch (error) {
      console.error(
        "Fixture cleanup failed:",
        redact(
          error?.stack ??
            error?.message ??
            error,
        ),
      );

      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();

      if (temporary) {
        fs.rmSync(
          temporary,
          {
            recursive: true,
            force: true,
          },
        );
      }
    }
  }
}

await main();
