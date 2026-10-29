import assert from "node:assert/strict";

import {
  ensureFrenchWardGoverningOfficerWithClient,
} from "../../src/domains/institutions/french-ward/governance/ensureFrenchWardGoverningOfficerWithClient";

type Officer = {
  id: string;
  userId: string;
  reference: string;
  displayName: string;
  institutionalTitle: string;
  secondaryTitle: string | null;
  governingBasis: string;
  provenanceReference: string | null;
  status: string;
};

const user = {
  id: "user-bobby-test",
  email: "societypublicrelations876@gmail.com",
  displayName: "Bobby French",
};

let record: Officer | null = null;

const client = {
  user: {
    async findUnique({ where }: any) {
      return where.id === user.id ? user : null;
    },
  },
  frenchWardGoverningOfficer: {
    async findUnique({ where }: any) {
      if (!record) return null;

      if (
        where.reference === record.reference ||
        where.userId === record.userId
      ) {
        return record;
      }

      return null;
    },

    async create({ data }: any) {
      record = {
        id: "fw-governance-bobby-test",
        ...data,
      };

      return record;
    },
  },
} as any;

const input = {
  userId: user.id,
  reference: "FW-GOV-001",
  displayName: "Bobby French",
  institutionalTitle: "Vice President",
  secondaryTitle: "Chief of Sales and Acquisitions",
  governingBasis: "French-Ward governing record",
  provenanceReference: "FW-REP-001",
};

async function main() {
  const created =
    await ensureFrenchWardGoverningOfficerWithClient({
    client,
    input,
  });

assert.equal(created.created, true);
assert.equal(created.record.reference, "FW-GOV-001");
assert.equal(created.record.userId, user.id);
assert.equal(created.record.status, "ACTIVE");

const retry =
  await ensureFrenchWardGoverningOfficerWithClient({
    client,
    input,
  });

assert.equal(retry.created, false);
assert.equal(retry.record.id, created.record.id);

await assert.rejects(
  ensureFrenchWardGoverningOfficerWithClient({
    client,
    input: {
      ...input,
      institutionalTitle: "Different Title",
    },
  }),
  /FW_GOVERNING_OFFICER_EXISTING_RECORD_CONFLICT/,
);

await assert.rejects(
  ensureFrenchWardGoverningOfficerWithClient({
    client,
    input: {
      ...input,
      userId: "missing-user",
      reference: "FW-GOV-002",
    },
  }),
  /FW_GOVERNING_OFFICER_USER_NOT_FOUND/,
);

console.log("✓ governing standing requires an existing canonical User");
console.log("✓ first creation records one durable officer identity");
console.log("✓ identical retry is idempotent");
console.log("✓ conflicting standing fails closed");
console.log("✓ no AXPT role or access grant is implied");
  console.log("✓ FW-BOARD-ID-1B CONTRACT PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
