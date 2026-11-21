const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const routeFile = path.resolve(
  "app/api/admin/institutional-access/profile-notice/route.ts"
);

const compiled = ts.transpileModule(
  fs.readFileSync(routeFile, "utf8"),
  {
    fileName: routeFile,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  }
);

assert.equal(
  (compiled.diagnostics || []).filter(
    d => d.category === ts.DiagnosticCategory.Error
  ).length,
  0
);

let principal = null;
let dispatches = 0;
let serviceOutcome = {
  status: "ACCEPTED",
  messageId: "synthetic-message",
  alreadyAttempted: false,
};

const originalFrom = process.env.FRENCH_WARD_EMAIL_FROM;
const originalKey = process.env.RESEND_API_KEY;

process.env.FRENCH_WARD_EMAIL_FROM = "French-Ward <test@example.invalid>";
process.env.RESEND_API_KEY = "inert-test-only";

const aliases = {
  "next/server": {
    NextResponse: {
      json: (body, options = {}) => ({
        status: options.status ?? 200,
        body,
      }),
    },
  },
  "@/domains/auth/getPrincipal": {
    getPrincipal: async () => principal,
  },
  "@/domains/auth/permissions": {
    PERMISSIONS: {
      INSTITUTIONAL_ACCESS_MANAGE: "INSTITUTIONAL_ACCESS_MANAGE",
    },
  },
  "@/infrastructure/db/prisma": { prisma: {} },
  "@/infrastructure/email/client": {
    resend: {
      emails: {
        send: async () => {
          throw new Error("REAL_PROVIDER_CALL_FORBIDDEN");
        },
      },
    },
  },
  "@/domains/institutional-access/sendProfileAccessNoticeWithClient": {
    sendProfileAccessNoticeWithClient: async args => {
      dispatches++;
      assert.equal(args.actorUserId, "operator-1");
      assert.equal(args.requestId, "request-1");
      assert.equal(args.deliveryKey, "FW-PROFILE-ROUTE-TEST-0001");
      return serviceOutcome;
    },
  },
};

const moduleRef = { exports: {} };
vm.runInNewContext(
  compiled.outputText,
  {
    module: moduleRef,
    exports: moduleRef.exports,
    require: name => {
      if (!Object.hasOwn(aliases, name)) {
        throw new Error("UNEXPECTED_IMPORT:" + name);
      }
      return aliases[name];
    },
    process,
    Error,
    console: {
      error: () => {},
    },
  },
  { filename: routeFile }
);

const { POST } = moduleRef.exports;

const valid = {
  requestId: "request-1",
  deliveryKey: "FW-PROFILE-ROUTE-TEST-0001",
};

function request(body = valid) {
  return {
    json: async () => body,
  };
}

async function check(status, body = valid) {
  const result = await POST(request(body));
  assert.equal(result.status, status);
  return result;
}

(async () => {
  principal = null;
  await check(401);
  assert.equal(dispatches, 0);
  console.log("✓ Unauthenticated caller denied");

  principal = { userId: "viewer-1", permissions: [] };
  await check(403);
  assert.equal(dispatches, 0);
  console.log("✓ Caller without management permission denied");

  principal = {
    userId: "operator-1",
    permissions: ["INSTITUTIONAL_ACCESS_MANAGE"],
  };

  await check(400, { requestId: "", deliveryKey: valid.deliveryKey });
  await check(400, { requestId: valid.requestId, deliveryKey: "short" });
  assert.equal(dispatches, 0);
  console.log("✓ Invalid request identifiers rejected");

  const accepted = await check(200);
  assert.equal(accepted.body.result.status, "ACCEPTED");
  assert.equal(dispatches, 1);
  console.log("✓ Authorized dispatch reaches guarded service");

  serviceOutcome = { status: "FAILED", alreadyAttempted: false };
  const failed = await check(200);
  assert.equal(failed.body.result.status, "FAILED");
  console.log("✓ Provider rejection represented as recorded failure");

  // Replace the service mock to simulate known domain errors.
  // The endpoint's error handling is tested with its actual catch block.
  const serviceModule =
    aliases["@/domains/institutional-access/sendProfileAccessNoticeWithClient"];

  serviceModule.sendProfileAccessNoticeWithClient = async () => {
    throw new Error("PROFILE_NOTICE_GRANT_UNAVAILABLE");
  };

  // The transpiled route holds the imported module object, so this
  // replacement is visible to the handler on subsequent calls.
  await check(409);
  console.log("✓ Missing or inactive grant returns 409");

  serviceModule.sendProfileAccessNoticeWithClient = async () => {
    throw new Error("PROFILE_NOTICE_UNRESOLVED_ATTEMPT");
  };
  await check(409);
  console.log("✓ Unresolved delivery claim returns 409");

  console.log("PROFILE_NOTICE_ADMIN_AUTHORIZATION_OK");
})()
.catch(error => {
  console.error("ROUTE_ACCEPTANCE_FAILED:", error.message);
  process.exitCode = 1;
})
.finally(() => {
  if (originalFrom === undefined) {
    delete process.env.FRENCH_WARD_EMAIL_FROM;
  } else {
    process.env.FRENCH_WARD_EMAIL_FROM = originalFrom;
  }

  if (originalKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalKey;
  }
});
