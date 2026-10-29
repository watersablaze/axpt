import assert from "node:assert/strict";

import {
  ensureFrenchWardGoverningIdentityWithClient,
} from "../../src/domains/institutions/french-ward/governance/ensureFrenchWardGoverningIdentityWithClient";

type UserRow = {
  id: string;
  username: string;
  email: string;
  name: string | null;
  displayName: string | null;
  isAdmin: boolean;
  tier: string | null;
  createdAt: Date;
};

type OfficerRow = {
  id: string;
  userId: string;
  reference: string;
  displayName: string;
  institutionalTitle: string;
  secondaryTitle: string | null;
  governingBasis: string;
  provenanceReference: string | null;
  status: string;
  createdByUserId: string | null;
};

let users: UserRow[] = [];
let officers: OfficerRow[] = [];

const client = {
  user: {
    async findMany({ where }: any) {
      const expected =
        where.email.equals.toLowerCase();

      return users
        .filter(
          user =>
            user.email.toLowerCase() === expected,
        )
        .slice(0, 2);
    },

    async findUnique({ where }: any) {
      return (
        users.find(
          user =>
            user.id === where.id,
        ) ?? null
      );
    },

    async create({ data }: any) {
      const user: UserRow = {
        id:
          `user-${users.length + 1}`,
        username:
          data.username,
        email:
          data.email,
        name:
          data.name ?? null,
        displayName:
          data.displayName ?? null,
        isAdmin:
          data.isAdmin ?? false,
        tier:
          data.tier ?? null,
        createdAt:
          new Date(),
      };

      users.push(user);

      return user;
    },
  },

  frenchWardGoverningOfficer: {
    async findUnique({ where }: any) {
      return (
        officers.find(
          officer =>
            (
              where.reference &&
              officer.reference ===
                where.reference
            ) ||
            (
              where.userId &&
              officer.userId ===
                where.userId
            ),
        ) ?? null
      );
    },

    async create({ data }: any) {
      const officer: OfficerRow = {
        id:
          `officer-${officers.length + 1}`,
        ...data,
      };

      officers.push(officer);

      return officer;
    },
  },
} as any;

const input = {
  email:
    "societypublicrelations876@gmail.com",
  displayName:
    "Bobby French",
  reference:
    "FW-GOV-001",
  institutionalTitle:
    "Vice President",
  secondaryTitle:
    "Chief of Sales and Acquisitions",
  governingBasis:
    "French-Ward governing record",
  provenanceReference:
    "FW-REP-001",
};

async function main() {
  const created =
    await ensureFrenchWardGoverningIdentityWithClient({
      client,
      input,
    });

  assert.equal(
    created.userCreated,
    true,
  );

  assert.equal(
    created.officerCreated,
    true,
  );

  assert.equal(
    created.user.email,
    input.email,
  );

  assert.equal(
    created.user.isAdmin,
    false,
  );

  assert.equal(
    created.user.tier,
    "french-ward-governance",
  );

  assert.equal(
    created.officer.reference,
    "FW-GOV-001",
  );

  assert.equal(
    created.officer.userId,
    created.user.id,
  );

  assert.equal(
    created.officer.provenanceReference,
    "FW-REP-001",
  );

  const retry =
    await ensureFrenchWardGoverningIdentityWithClient({
      client,
      input,
    });

  assert.equal(
    retry.userCreated,
    false,
  );

  assert.equal(
    retry.officerCreated,
    false,
  );

  assert.equal(
    users.length,
    1,
  );

  assert.equal(
    officers.length,
    1,
  );

  await assert.rejects(
    ensureFrenchWardGoverningIdentityWithClient({
      client,
      input: {
        ...input,
        displayName:
          "Contradictory Name",
      },
    }),
    /FW_GOVERNING_IDENTITY_EXISTING_USER_NAME_CONFLICT/,
  );

  users.push({
    id:
      "case-conflict",
    username:
      "legacy-conflict",
    email:
      "SOCIETYPUBLICRELATIONS876@gmail.com",
    name:
      "Bobby French",
    displayName:
      "Bobby French",
    isAdmin:
      false,
    tier:
      null,
    createdAt:
      new Date(),
  });

  await assert.rejects(
    ensureFrenchWardGoverningIdentityWithClient({
      client,
      input,
    }),
    /FW_GOVERNING_IDENTITY_EMAIL_CONTRADICTION/,
  );

  console.log(
    "✓ canonical User created before governing standing",
  );
  console.log(
    "✓ identity and governing standing are idempotent",
  );
  console.log(
    "✓ case-variant duplicate identity fails closed",
  );
  console.log(
    "✓ contradictory existing display identity fails closed",
  );
  console.log(
    "✓ no role, grant, instrument authority or communication is implied",
  );
  console.log(
    "✓ FW-BOARD-ID-1D CONTRACT PASSED",
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
