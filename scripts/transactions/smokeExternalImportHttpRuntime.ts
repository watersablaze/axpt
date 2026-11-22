import assert from "node:assert/strict";

import {
  createExternalImportPost,
} from "../../src/domains/control-center/transaction-intakes/createExternalImportPost";

const url =
  "https://axpt.example.test/api/admin/transaction-intakes/external-import";

const fields = {
  operationalReference: "FW-TXN-SYNTHETIC-HTTP-RUNTIME",
  submitterName: "Synthetic Source",
  submitterEmail: "source@example.test",
  submitterRole: "INTERMEDIARY_UNVERIFIED",
  buyerName: "Synthetic Buyer",
  commodity: "Gold Dore",
  trialQuantity: "50 kg",
  monthlyQuantity: "50-100 kg",
  destination: "Dubai",
  originatingCandidateName: "Synthetic Candidate",
  deliveryTerms: "Proposed, not accepted",
  settlementMethod: "Unverified",
  confirmation: "REGISTER EXTERNAL INTAKE",
};

type Scenario = {
  authenticated?: boolean;
  roleAllowed?: boolean;
  permissionAllowed?: boolean;
  persistedAdmin?: boolean;
  confirmation?: string;
  origin?: string;
  malformed?: boolean;
  oversized?: boolean;
  privateStorage?: boolean;
  custodyError?: string;
  registrationError?: string;
  replay?: boolean;
};

function request(options: Scenario = {}) {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    form.append(
      key,
      key === "confirmation"
        ? options.confirmation ?? value
        : value,
    );
  }

  form.append(
    "evidencePdf",
    new File(
      [Buffer.from("%PDF-1.7\nSYNTHETIC ONLY\n%%EOF")],
      "synthetic.pdf",
      { type: "application/pdf" },
    ),
  );

  const headers: Record<string, string> = {
    origin: options.origin ?? "https://axpt.example.test",
    host: "axpt.example.test",
  };

  if (options.oversized) {
    headers["content-length"] = "26000001";
  }

  if (options.malformed) {
    headers["content-type"] = "multipart/form-data; boundary=invalid";
  }

  return new Request(url, {
    method: "POST",
    headers,
    body: options.malformed ? "INVALID MULTIPART BODY" : form,
  });
}

function harness(options: Scenario = {}) {
  const calls = {
    operatorLookup: 0,
    config: 0,
    store: 0,
    custody: 0,
    registration: 0,
  };

  const principal = {
    userId: "synthetic-operator",
    email: "operator@example.test",
    roles: options.roleAllowed === false ? [] : ["ADMIN_PLATFORM"],
    permissions: options.permissionAllowed === false
      ? []
      : ["ADMIN_SURFACE_ACCESS"],
  };

  const dependencies = {
    getPrincipal: async () =>
      options.authenticated === false ? null : principal,

    prisma: {
      user: {
        findUnique: async () => {
          calls.operatorLookup++;
          return {
            id: "synthetic-operator",
            isAdmin: options.persistedAdmin !== false,
          };
        },
      },
    },

    loadNeonObjectStorageConfig: () => {
      calls.config++;
      return options.privateStorage === false
        ? null
        : { synthetic: true };
    },

    createExternalIntakeConditionalS3Store: () => {
      calls.store++;
      return { synthetic: true };
    },

    registerExternalIntakeWithClient: async () => {
      calls.registration++;

      if (options.registrationError) {
        throw new Error(options.registrationError);
      }

      return {
        id: "synthetic-intake",
        alreadyRegistered: options.replay === true,
      };
    },

    registerExternalIntakeWithCustody: async (
      input: {
        register: (value: unknown) => Promise<unknown>;
        registration: {
          source: string;
          evidenceBytes: Uint8Array;
        };
        confirmation: string;
      },
    ) => {
      calls.custody++;

      assert.equal(
        input.confirmation,
        "REGISTER EXTERNAL INTAKE",
      );
      assert.equal(
        input.registration.source,
        "EXTERNAL_EMAIL",
      );
      assert.ok(input.registration.evidenceBytes.byteLength > 5);

      if (options.custodyError) {
        throw new Error(options.custodyError);
      }

      const receipt = await input.register(input.registration);

      return {
        receipt,
        custody: {
          reference: "synthetic/evidence.pdf",
          sha256: "a".repeat(64),
          byteLength: input.registration.evidenceBytes.byteLength,
          disposition: "CREATED",
        },
      };
    },
  };

  const post = createExternalImportPost(
    dependencies as unknown as Parameters<typeof createExternalImportPost>[0],
  );

  return { post, calls };
}

async function check(
  title: string,
  options: Scenario,
  status: number,
  error: string | null,
  expected: Partial<ReturnType<typeof harness>["calls"]> = {},
) {
  const { post, calls } = harness(options);
  const response = await post(request(options));
  const body = await response.json();

  assert.equal(response.status, status, title);
  assert.equal(
    response.headers.get("cache-control"),
    "private, no-store, max-age=0",
    title,
  );
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");

  if (error) {
    assert.deepEqual(body, { ok: false, error }, title);
  } else {
    assert.equal(body.ok, true, title);
    assert.equal(
      body.intake.alreadyRegistered,
      options.replay === true,
      title,
    );
    assert.equal(body.evidence.reference, "synthetic/evidence.pdf");
    assert.equal(body.registrationMode, "OPERATOR_EXTERNAL_IMPORT");
    assert.equal(body.buyerAuthorityVerified, false);
    assert.equal(body.representativeAuthorityGranted, false);
    assert.equal(body.opportunityPromoted, false);
  }

  for (const [key, value] of Object.entries(expected)) {
    assert.equal(
      calls[key as keyof typeof calls],
      value,
      `${title}: ${key}`,
    );
  }

  if (error) {
    assert.equal(calls.registration, expected.registration ?? 0, title);
  }

  console.log("PASS:", title);
}

async function main() {
  await check(
    "unauthenticated request rejected before database",
    { authenticated: false },
    401,
    "UNAUTHORIZED",
    { operatorLookup: 0, store: 0, custody: 0 },
  );

  await check(
    "missing platform role rejected",
    { roleAllowed: false },
    403,
    "FORBIDDEN",
    { operatorLookup: 0, custody: 0 },
  );

  await check(
    "missing permission rejected",
    { permissionAllowed: false },
    403,
    "FORBIDDEN",
    { operatorLookup: 0, custody: 0 },
  );

  await check(
    "invalid origin rejected before database",
    { origin: "https://foreign.example.test" },
    403,
    "REQUEST_ORIGIN_MISMATCH",
    { operatorLookup: 0, custody: 0 },
  );

  await check(
    "persisted nonadministrator rejected",
    { persistedAdmin: false },
    403,
    "FORBIDDEN",
    { operatorLookup: 1, config: 0, custody: 0 },
  );

  await check(
    "oversized request rejected",
    { oversized: true },
    413,
    "REQUEST_TOO_LARGE",
    { operatorLookup: 0, custody: 0 },
  );

  await check(
    "malformed multipart rejected",
    { malformed: true },
    400,
    "INVALID_FORM_DATA",
    { config: 0, custody: 0 },
  );

  await check(
    "missing explicit confirmation rejected",
    { confirmation: "NOT CONFIRMED" },
    400,
    "EXPLICIT_CONFIRMATION_REQUIRED",
    { config: 0, custody: 0 },
  );

  await check(
    "private storage unavailable",
    { privateStorage: false },
    503,
    "PRIVATE_STORAGE_UNAVAILABLE",
    { config: 1, store: 0, custody: 0 },
  );

  await check(
    "custody failure blocks registration",
    { custodyError: "FW_TXN_CUSTODY_UNAVAILABLE" },
    503,
    "EVIDENCE_CUSTODY_UNAVAILABLE",
    { store: 1, custody: 1, registration: 0 },
  );

  await check(
    "registration conflict returns no success receipt",
    { registrationError: "FW_TXN_REGISTRATION_CONFLICT" },
    409,
    "REGISTRATION_CONFLICT",
    { custody: 1, registration: 1 },
  );

  await check(
    "new registration returns restricted receipt",
    {},
    201,
    null,
    { custody: 1, registration: 1 },
  );

  await check(
    "idempotent replay returns existing receipt",
    { replay: true },
    200,
    null,
    { custody: 1, registration: 1 },
  );

  console.log("PASS: FW-TXN-1B.3H.3D HTTP runtime contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
