import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  registerGsamInstitutionalParticipation as register,
} from "../../src/domains/institutions/french-ward/gsam/registerGsamInstitutionalParticipation.ts";

const EXPECTED_DB = "axpt_gsam_participation_acceptance_20261025";
const REFERENCE = "FW-GSAM-JV-2026-001";
const ACTOR = "gsam-isolated-operator-test";

const url = process.env.DATABASE_URL;

assert.ok(url, "DATABASE_URL_REQUIRED");

const parsed = new URL(url);

assert.equal(parsed.hostname, "127.0.0.1");
assert.equal(parsed.port, "5432");
assert.equal(parsed.pathname, "/" + EXPECTED_DB);
assert.equal(parsed.username, "jamalward");

const a = new PrismaClient({
  datasources: { db: { url } },
});

const b = new PrismaClient({
  datasources: { db: { url } },
});

const table = a.gsamInstitutionalParticipation;

async function count() {
  return table.count();
}

try {
  const [database] = await a.$queryRaw`
    SELECT current_database() AS name,
           host(inet_server_addr()) AS host,
           inet_server_port() AS port
  `;

  assert.equal(database.name, EXPECTED_DB);
  assert.equal(database.host, "127.0.0.1");
  assert.equal(database.port, 5432);

  assert.equal(await count(), 0);
  console.log("✓ Verified isolated PostgreSQL connection");

  const results = await Promise.all([
    register({ client: a, actorUserId: ACTOR }),
    register({ client: b, actorUserId: ACTOR }),
  ]);

  assert.deepEqual(
    results.map(result => result.created).sort(),
    [false, true],
  );

  assert.equal(results[0].record.id, results[1].record.id);
  assert.equal(await count(), 1);

  console.log("✓ Concurrent requests produced one record");

  const record = await table.findUniqueOrThrow({
    where: { reference: REFERENCE },
  });

  assert.equal(
    record.institutionLegalName,
    "Growthcorp Solutions Asset Management Limited",
  );
  assert.equal(record.representativeName, "James Crawford");
  assert.equal(record.createdByUserId, ACTOR);
  assert.equal(record.documentationStatus, "PENDING_REVIEW");
  assert.equal(record.accessStatus, "NOT_PROVISIONED");

  console.log("✓ Identity, creator, and restricted states persisted");

  const retry = await register({
    client: a,
    actorUserId: ACTOR,
  });

  assert.equal(retry.created, false);
  assert.equal(retry.record.id, record.id);
  assert.equal(
    retry.record.updatedAt.getTime(),
    record.updatedAt.getTime(),
  );

  console.log("✓ Identical retry performed no record update");

  await table.update({
    where: { reference: REFERENCE },
    data: { representativeName: "CONFLICT_TEST_ONLY" },
  });

  await assert.rejects(
    register({ client: a, actorUserId: ACTOR }),
    /GSAM_INSTITUTIONAL_PARTICIPATION_CONFLICT/,
  );

  await table.update({
    where: { reference: REFERENCE },
    data: { representativeName: "James Crawford" },
  });

  assert.equal(await count(), 1);

  console.log("✓ Persisted conflicting identity rejected");

  await assert.rejects(
    register({ client: a, actorUserId: "  " }),
    /GSAM_REGISTRATION_ACTOR_REQUIRED/,
  );

  assert.equal(await count(), 1);

  console.log("✓ Missing actor rejected without registration");

  const deleted = await table.deleteMany({
    where: {
      reference: REFERENCE,
      createdByUserId: ACTOR,
    },
  });

  assert.equal(deleted.count, 1);
  assert.equal(await count(), 0);

  console.log("✓ Test record removed from isolated database");
  console.log("✓ FW-GSAM-ARP-1C.2 POSTGRESQL ACCEPTANCE PASSED");
} finally {
  await Promise.all([a.$disconnect(), b.$disconnect()]);
}
