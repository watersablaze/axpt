import assert from "node:assert/strict";

import {
  EXTERNAL_INTAKE_CONFIRMATION,
  registerExternalIntakeWithCustody,
} from "../../src/domains/control-center/transaction-intakes/registerExternalIntakeWithCustody";

const bytes = Buffer.from(
  "%PDF-1.7\nSYNTHETIC OPERATOR TEST\n%%EOF",
);

const objects = new Map<string, Uint8Array>();
const steps: string[] = [];

const store = {
  async putIfAbsent(
    key: string,
    content: Uint8Array,
    type: string,
  ): Promise<"created" | "exists"> {
    steps.push("custody-write");
    assert.equal(type, "application/pdf");

    if (objects.has(key)) return "exists";

    objects.set(key, Uint8Array.from(content));
    return "created";
  },

  async read(key: string) {
    steps.push("custody-read");
    const value = objects.get(key);

    if (!value) throw new Error("MISSING_OBJECT");

    return Uint8Array.from(value);
  },
};

const principal = {
  userId: "synthetic-admin",
  email: "admin@example.test",
  roles: ["ADMIN_PLATFORM"],
  permissions: ["ADMIN_SURFACE_ACCESS"],
};

const registration = {
  operationalReference: "FW-TXN-SYNTHETIC-COMMAND-1",
  source: "EXTERNAL_EMAIL" as const,
  evidenceBytes: bytes,
  submitterName: "Synthetic Intermediary",
  submitterEmail: "intermediary@example.test",
  submitterRole: "INTERMEDIARY_UNVERIFIED",
  buyerName: "Synthetic Buyer",
  commodity: "Gold Dore",
  trialQuantity: "50 kg",
  monthlyQuantity: "50-100 kg",
  destination: "Synthetic Destination",
  originatingCandidateName: "Synthetic Candidate",
  deliveryTerms: "Proposed, not accepted",
  settlementMethod: "Unverified",
};

type Command = Parameters<
  typeof registerExternalIntakeWithCustody
>[0];

let registrations = 0;

const register: Command["register"] = async (value) => {
  steps.push("registration");
  registrations++;

  assert.equal(value.operatorUserId, principal.userId);
  assert.deepEqual(
    [...value.evidenceBytes],
    [...bytes],
  );
  assert.match(
    value.sourceEvidenceReference,
    /^french-ward\/external-intake\/sha256\/[a-f0-9]{64}\.pdf$/,
  );

  return {
    intakeId: "synthetic-intake-id",
    intakeReference: "AXPT-INT-EXT-SYNTHETIC",
    status: "SUBMITTED",
    alreadyRegistered: false,
    evidenceSha256: value.sourceEvidenceSha256,
  };
};

function command(
  overrides: Partial<Command> = {},
): Command {
  return {
    principal,
    confirmation: EXTERNAL_INTAKE_CONFIRMATION,
    registration,
    store,
    register,
    ...overrides,
  };
}

async function main() {
  await assert.rejects(
    registerExternalIntakeWithCustody(
      command({ principal: null }),
    ),
    /FW_TXN_OPERATOR_AUTHORITY_REQUIRED/,
  );

  await assert.rejects(
    registerExternalIntakeWithCustody(
      command({
        principal: {
          ...principal,
          roles: [],
        },
      }),
    ),
    /FW_TXN_OPERATOR_AUTHORITY_REQUIRED/,
  );

  await assert.rejects(
    registerExternalIntakeWithCustody(
      command({
        principal: {
          ...principal,
          permissions: [],
        },
      }),
    ),
    /FW_TXN_OPERATOR_AUTHORITY_REQUIRED/,
  );

  await assert.rejects(
    registerExternalIntakeWithCustody(
      command({ confirmation: "REGISTER" }),
    ),
    /FW_TXN_EXPLICIT_CONFIRMATION_REQUIRED/,
  );

  assert.deepEqual(steps, []);

  console.log("PASS: authority and confirmation precede custody");

  await assert.rejects(
    registerExternalIntakeWithCustody(
      command({
        registration: {
          ...registration,
          buyerName: "",
        },
      }),
    ),
    /FW_TXN_REQUIRED:buyerName/,
  );

  assert.deepEqual(steps, []);

  console.log("PASS: invalid intake rejected before storage");

  const first = await registerExternalIntakeWithCustody(
    command(),
  );

  assert.equal(first.custody.disposition, "created");
  assert.equal(first.receipt.intakeId, "synthetic-intake-id");
  assert.deepEqual(steps, [
    "custody-write",
    "custody-read",
    "registration",
  ]);

  assert.equal(registrations, 1);

  console.log("PASS: verified custody precedes persistence");

  const replay = await registerExternalIntakeWithCustody(
    command(),
  );

  assert.equal(replay.custody.disposition, "exists");
  assert.equal(replay.custody.reference, first.custody.reference);
  assert.equal(objects.size, 1);

  console.log("PASS: repeated request preserves evidence identity");

  steps.length = 0;

  await assert.rejects(
    registerExternalIntakeWithCustody(
      command({
        store: {
          ...store,
          async read() {
            throw new Error("STORAGE_READ_FAILED");
          },
        },
      }),
    ),
    /FW_TXN_CUSTODY_READ_FAILED/,
  );

  assert.equal(registrations, 2);

  console.log("PASS: custody failure blocks registration");

  console.log("PASS: FW-TXN-1B.3F.2 operator command contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
