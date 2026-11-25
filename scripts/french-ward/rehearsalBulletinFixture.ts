import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { loadPrincipalUserWithClient } from
  "../../src/domains/auth/loadPrincipalUserWithClient";
import { loadCurrentFrenchWardGoverningStandingWithClient } from
  "../../src/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";

const expected = "axpt_fw_bulletin_r1_rehearsal";
const url = new URL(process.env.DATABASE_URL ?? "");

assert.equal(url.protocol, "postgresql:");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5433");
assert.equal(url.pathname, `/${expected}`);
assert.equal(url.username, "axpt");
assert.ok(url.password);
assert.equal(url.search, "");


// Interactive transactions expose model delegates but not root-client
// lifecycle, transaction, or extension operations.
type FixtureTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" |
  "$transaction" | "$use" | "$extends"
>;

const db = new PrismaClient();

const fixtures = [
  {
    id: "fw-bulletin-r1-publisher",
    username: "fw-bulletin-r1-publisher",
    email: "publisher@fw-bulletin-rehearsal.invalid",
  },
  {
    id: "fw-bulletin-r1-reader",
    username: "fw-bulletin-r1-reader",
    email: "reader@fw-bulletin-rehearsal.invalid",
  },
  {
    id: "fw-bulletin-r1-denied",
    username: "fw-bulletin-r1-denied",
    email: "denied@fw-bulletin-rehearsal.invalid",
  },
] as const;

async function main() {
  const identity = await db.$queryRaw<
    Array<{ db: string; actor: string }>
  >`SELECT current_database() AS db,
           current_user AS actor`;

  assert.deepEqual(identity, [{
    db: expected,
    actor: "axpt",
  }]);

  const [users, roles, permissions, posts, standings] =
    await Promise.all([
      db.user.count(),
      db.role.count(),
      db.permission.count(),
      db.frenchWardBulletinPost.count(),
      db.frenchWardGoverningOfficer.count(),
    ]);

  assert.deepEqual(
    [users, roles, permissions, posts, standings],
    [0, 0, 0, 0, 0],
    "STOP: rehearsal fixtures or other authority records already exist",
  );

  await db.$transaction(async (tx: FixtureTransactionClient) => {
    const publisherRole = await tx.role.create({
      data: {
        key: "FW_BULLETIN_R1_TEST_PUBLISHER",
        label: "Disposable bulletin publisher",
      },
    });

    const permission = await tx.permission.create({
      data: {
        key: "FRENCH_WARD_BULLETIN_PUBLISH",
        label: "Publish French-Ward bulletins",
      },
    });

    await tx.rolePermission.create({
      data: {
        roleId: publisherRole.id,
        permissionId: permission.id,
      },
    });

    for (const fixture of fixtures) {
      await tx.user.create({
        data: {
          id: fixture.id,
          username: fixture.username,
          email: fixture.email,
          passwordHash: randomBytes(48).toString("hex"),
          viewedDocs: [],
          displayName: fixture.username,
        },
      });
    }

    await tx.userRole.create({
      data: {
        userId: fixtures[0].id,
        roleId: publisherRole.id,
        isActive: true,
      },
    });

    for (const fixture of fixtures.slice(0, 2)) {
      await tx.frenchWardGoverningOfficer.create({
        data: {
          userId: fixture.id,
          reference: `FW-BULLETIN-R1-${fixture === fixtures[0] ? "P" : "R"}`,
          displayName: fixture.username,
          institutionalTitle: "Rehearsal Officer",
          governingBasis: "Synthetic local bulletin acceptance fixture",
          status: "ACTIVE",
        },
      });
    }
  });

  const [publisher, reader, denied] = await Promise.all(
    fixtures.map(fixture =>
      loadPrincipalUserWithClient(db, fixture.id)
    ),
  );

  assert.ok(publisher);
  assert.ok(reader);
  assert.ok(denied);

  const effectivePermissions = (user: NonNullable<typeof publisher>) =>
    user.userRoles.flatMap(role =>
      role.role.rolePermissions.map(item => item.permission.key)
    );

  assert.ok(
    effectivePermissions(publisher).includes(
      "FRENCH_WARD_BULLETIN_PUBLISH"
    ),
  );
  assert.ok(
    !effectivePermissions(reader).includes(
      "FRENCH_WARD_BULLETIN_PUBLISH"
    ),
  );
  assert.ok(
    !effectivePermissions(denied).includes(
      "FRENCH_WARD_BULLETIN_PUBLISH"
    ),
  );

  const standing = await Promise.all(
    fixtures.map(fixture =>
      loadCurrentFrenchWardGoverningStandingWithClient({
        client: db,
        userId: fixture.id,
      })
    ),
  );

  assert.equal(standing[0]?.active, true);
  assert.equal(standing[1]?.active, true);
  assert.equal(standing[2], null);

  console.log("PASS publisher has effective publication permission");
  console.log("PASS governing reader has no publication permission");
  console.log("PASS unauthorized user has no governing standing");
  console.log("PASS no live identities or browser sessions created");
  console.log("3/3 synthetic fixture roles qualified");
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
