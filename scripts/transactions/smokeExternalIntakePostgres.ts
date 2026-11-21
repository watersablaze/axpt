import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { URL } from "node:url";
import { PrismaClient } from "@prisma/client";

import {
  registerExternalIntakeWithClient,
} from "../../src/domains/control-center/transaction-intakes/registerExternalIntakeWithClient";

const TARGET = "axpt_fw_txn_1b2c_test";
const DATABASE_CONNECTION_URL = process.env.DATABASE_URL;
const DIRECT = process.env.DIRECT_URL;

function guard(url: string | undefined) {
  assert.ok(url, "FW_TXN_TEST_DATABASE_URL_MISSING");
  const parsed = new URL(url);
  assert.equal(parsed.hostname, "127.0.0.1");
  assert.equal(parsed.port, "5433");
  assert.equal(parsed.pathname, `/${TARGET}`);
}

guard(DATABASE_CONNECTION_URL);
guard(DIRECT);
assert.equal(process.env.FW_TXN_ACCEPT_DB, TARGET);

const prisma = new PrismaClient();
const nonce = randomUUID().replaceAll("-", "");
const prefix = `FW-TXN-PG-${nonce}`;

const adminId = `fw-pg-admin-${nonce}`;
const nonAdminId = `fw-pg-viewer-${nonce}`;

const evidenceBytes = Buffer.from(
  `SYNTHETIC FW TRANSACTION EVIDENCE ${nonce}`,
);

const evidenceHash = createHash("sha256")
  .update(evidenceBytes)
  .digest("hex");

const base = {
  operationalReference: `${prefix}-FIRST`,
  operatorUserId: adminId,
  source: "EXTERNAL_EMAIL" as const,
  sourceEvidenceReference: `test-custody/${nonce}/evidence`,
  sourceEvidenceSha256: evidenceHash,
  evidenceBytes,
  submitterName: "Synthetic Intermediary",
  submitterEmail: "synthetic-intermediary@example.test",
  submitterRole: "INTERMEDIARY_UNVERIFIED",
  buyerName: "SYNTHETIC BUYER - NOT LIVE",
  commodity: "Gold Dore - Test",
  trialQuantity: "50 kg",
  monthlyQuantity: "50-100 kg",
  destination: "Synthetic Test Destination",
  originatingCandidateName: "Synthetic Candidate",
  deliveryTerms: "Proposed delivery only",
  settlementMethod: "Unverified synthetic settlement",
};

const references = new Set<string>();
const intakeIds = new Set<string>();

function track<T extends { intakeId: string; intakeReference: string }>(
  receipt: T,
) {
  intakeIds.add(receipt.intakeId);
  references.add(receipt.intakeReference);
  return receipt;
}

async function count(reference: string) {
  const intakes = await prisma.transactionIntake.findMany({
    where: { reference },
    select: { id: true },
  });

  const events = await prisma.transactionIntakeEvent.count({
    where: {
      intakeId: { in: intakes.map((entry: { id: string }) => entry.id) },
      eventType: "EXTERNAL_INTAKE_REGISTERED",
    },
  });

  return { intakes: intakes.length, events };
}

async function main() {
  const db = await prisma.$queryRaw<Array<{ database: string }>>`
    SELECT current_database() AS database
  `;
  assert.equal(db[0]?.database, TARGET);
  console.log("PASS: connected to isolated PostgreSQL");

  await prisma.user.create({
    data: {
      id: adminId,
      username: `fwpg-admin-${nonce}`,
      email: `fwpg-admin-${nonce}@example.test`,
      passwordHash: "SYNTHETIC-NONLOGIN",
      isAdmin: true,
      viewedDocs: [],
    },
  });

  await prisma.user.create({
    data: {
      id: nonAdminId,
      username: `fwpg-viewer-${nonce}`,
      email: `fwpg-viewer-${nonce}@example.test`,
      passwordHash: "SYNTHETIC-NONLOGIN",
      isAdmin: false,
      viewedDocs: [],
    },
  });

  console.log("PASS: synthetic operator fixtures");

  const first = track(
    await registerExternalIntakeWithClient(prisma, base),
  );

  assert.equal(first.alreadyRegistered, false);
  assert.deepEqual(await count(first.intakeReference), {
    intakes: 1,
    events: 1,
  });

  const stored = await prisma.transactionIntake.findUniqueOrThrow({
    where: { id: first.intakeId },
  });

  assert.equal(stored.referralConfirmed, false);
  assert.equal(stored.authorityToRepresent, false);
  assert.equal(stored.authorityToNegotiate, false);
  assert.equal(stored.authorityToSign, false);
  assert.equal(stored.referredByName, "Synthetic Candidate");

  console.log("PASS: first registration and authority boundaries");

  const replay = track(
    await registerExternalIntakeWithClient(prisma, base),
  );

  assert.equal(replay.alreadyRegistered, true);
  assert.equal(replay.intakeId, first.intakeId);
  assert.deepEqual(await count(first.intakeReference), {
    intakes: 1,
    events: 1,
  });

  console.log("PASS: identical replay is idempotent");

  await assert.rejects(
    registerExternalIntakeWithClient(prisma, {
      ...base,
      settlementMethod: "ALTERED SYNTHETIC SETTLEMENT",
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  await assert.rejects(
    registerExternalIntakeWithClient(prisma, {
      ...base,
      trialQuantity: "100 kg",
    }),
    /FW_TXN_REGISTRATION_CONFLICT/,
  );

  await assert.rejects(
    registerExternalIntakeWithClient(prisma, {
      ...base,
      sourceEvidenceSha256: "0".repeat(64),
    }),
    /FW_TXN_EVIDENCE_HASH_MISMATCH/,
  );

  assert.deepEqual(await count(first.intakeReference), {
    intakes: 1,
    events: 1,
  });

  console.log("PASS: changed terms and evidence hash rejected");

  const unauthorizedRef = `${prefix}-UNAUTHORIZED`;

  await assert.rejects(
    registerExternalIntakeWithClient(prisma, {
      ...base,
      operationalReference: unauthorizedRef,
      operatorUserId: nonAdminId,
    }),
    /FW_TXN_OPERATOR_UNAUTHORIZED/,
  );

  console.log("PASS: non-administrator rejected");

  const rollbackRef = `${prefix}-ROLLBACK`;

  const failingClient = {
    $transaction: (callback: any) =>
      prisma.$transaction(async (tx: Pick<PrismaClient, "transactionIntake" | "transactionIntakeEvent" | "user">) => {
        const wrapped = {
          user: tx.user,
          transactionIntake: tx.transactionIntake,
          transactionIntakeEvent: {
            findFirst: (...args: any[]) =>
              (tx.transactionIntakeEvent.findFirst as any)(...args),
            create: async () => {
              throw new Error("FW_TXN_SYNTHETIC_EVENT_FAILURE");
            },
          },
        };
        return callback(wrapped);
      }),
  };

  await assert.rejects(
    registerExternalIntakeWithClient(
      failingClient as any,
      { ...base, operationalReference: rollbackRef },
    ),
    /FW_TXN_SYNTHETIC_EVENT_FAILURE/,
  );

  const rolledBack = await prisma.transactionIntake.count({
    where: {
      internalNotes: { contains: rollbackRef },
    },
  });

  assert.equal(rolledBack, 0);
  console.log("PASS: real PostgreSQL transaction rollback");

  const concurrentInput = {
    ...base,
    operationalReference: `${prefix}-CONCURRENT`,
  };

  console.log("RUN: simultaneous identical registrations");

  const outcomes = await Promise.allSettled([
    registerExternalIntakeWithClient(prisma, concurrentInput),
    registerExternalIntakeWithClient(prisma, concurrentInput),
  ]);

  for (const outcome of outcomes) {
    if (outcome.status === "fulfilled") {
      track(outcome.value);
    }
  }

  const committed = outcomes.filter(
    (outcome) => outcome.status === "fulfilled",
  );

  const rejected = outcomes.filter(
    (outcome) => outcome.status === "rejected",
  );

  console.log(
    `Concurrent results: fulfilled=${committed.length}, rejected=${rejected.length}`,
  );

  for (const outcome of rejected) {
    if (outcome.status === "rejected") {
      const reason = outcome.reason;
      console.log(
        "Concurrent rejection:",
        reason?.code ?? reason?.message ?? String(reason),
      );
    }
  }

  assert.equal(
    committed.length,
    2,
    "FW_TXN_CONCURRENT_IDEMPOTENCY_NOT_YET_SATISFIED",
  );

  const ids = committed.map((item) =>
    item.status === "fulfilled" ? item.value.intakeId : null,
  );

  assert.equal(new Set(ids).size, 1);
  assert.deepEqual(
    await count(committed[0].status === "fulfilled"
      ? committed[0].value.intakeReference
      : ""),
    { intakes: 1, events: 1 },
  );

  console.log("PASS: simultaneous registration is idempotent");
  console.log("PASS: FW-TXN-1B.2D PostgreSQL acceptance");
}

async function cleanup() {
  const owned = await prisma.transactionIntake.findMany({
    where: {
      OR: [
        { internalNotes: { contains: prefix } },
        { id: { in: [...intakeIds] } },
        { reference: { in: [...references] } },
      ],
    },
    select: { id: true, internalNotes: true },
  });

  const ids = owned
    .filter((entry: { id: string; internalNotes: string | null }) =>
      entry.internalNotes?.includes(prefix),
    )
    .map((entry: { id: string }) => entry.id);

  if (ids.length) {
    await prisma.transactionIntakeEvent.deleteMany({
      where: { intakeId: { in: ids } },
    });

    await prisma.transactionIntake.deleteMany({
      where: { id: { in: ids } },
    });
  }

  await prisma.user.deleteMany({
    where: { id: { in: [adminId, nonAdminId] } },
  });

  console.log("PASS: synthetic fixtures cleaned");
}

main()
  .catch((error) => {
    console.error(
      "FAIL:",
      error?.code ?? error?.message ?? String(error),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (error) {
      console.error("FAIL: synthetic cleanup", error);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  });
