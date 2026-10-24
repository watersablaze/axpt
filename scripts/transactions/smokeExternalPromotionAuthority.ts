import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { prisma as servicePrisma } from "../../src/lib/prisma";
import { registerExternalIntakeWithClient } from
  "../../src/domains/control-center/transaction-intakes/registerExternalIntakeWithClient";
import { promoteTransactionIntakeToOpportunity } from
  "../../src/domains/control-center/transaction-intakes/promoteTransactionIntakeToOpportunity";

const TARGET = "axpt_fw_txn_1b2c_test";

for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  const value = process.env[key];
  assert.ok(value, `${key}_MISSING`);
  const parsed = new URL(value);
  assert.equal(parsed.hostname, "127.0.0.1");
  assert.equal(parsed.port, "5433");
  assert.equal(parsed.pathname, `/${TARGET}`);
}
assert.equal(process.env.FW_TXN_ACCEPT_DB, TARGET);

const prisma = new PrismaClient();
const nonce = randomUUID().replaceAll("-", "");
const adminId = `fw-promote-guard-${nonce}`;
const operationalReference = `FW-TXN-AUTH-${nonce}`;
const evidenceBytes = Buffer.from(`SYNTHETIC ONLY ${nonce}`);
const evidenceSha256 = createHash("sha256")
  .update(evidenceBytes)
  .digest("hex");

let createdIntakeId: string | null = null;

async function run() {
  const database = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT current_database() AS name
  `;
  assert.equal(database[0]?.name, TARGET);
  console.log("PASS: isolated PostgreSQL identity");

  await prisma.user.create({
    data: {
      id: adminId,
      username: adminId,
      email: `${adminId}@example.test`,
      passwordHash: "SYNTHETIC-NONLOGIN",
      isAdmin: true,
      viewedDocs: [],
    },
  });

  const receipt = await registerExternalIntakeWithClient(prisma, {
    operationalReference,
    operatorUserId: adminId,
    source: "EXTERNAL_EMAIL",
    sourceEvidenceReference: `test-custody/${nonce}/evidence`,
    sourceEvidenceSha256: evidenceSha256,
    evidenceBytes,
    submitterName: "Synthetic Intermediary",
    submitterEmail: "synthetic-intermediary@example.test",
    submitterRole: "INTERMEDIARY_UNVERIFIED",
    buyerName: "SYNTHETIC BUYER - NOT LIVE",
    commodity: "Gold Dore - Synthetic",
    trialQuantity: "50 kg",
    monthlyQuantity: "100 kg",
    destination: "Synthetic Destination",
    originatingCandidateName: "Synthetic Candidate",
    deliveryTerms: "Synthetic proposed delivery",
    settlementMethod: "Unverified synthetic settlement",
  });

  createdIntakeId = receipt.intakeId;
  assert.equal(receipt.alreadyRegistered, false);

  const provenance = await prisma.transactionIntakeEvent.findFirst({
    where: {
      intakeId: receipt.intakeId,
      eventType: "EXTERNAL_INTAKE_REGISTERED",
    },
  });

  assert.ok(provenance?.note);
  const metadata = JSON.parse(provenance.note);
  assert.equal(metadata.registrationMode, "OPERATOR_EXTERNAL_IMPORT");
  assert.equal(metadata.evidenceSha256, evidenceSha256);
  console.log("PASS: registration event and custody identity");

  const registry = await prisma.transactionIntake.findMany({
    where: {
      AND: [
        { status: { notIn: ["ARCHIVED", "TEST"] } },
        { reference: { contains: receipt.intakeReference, mode: "insensitive" } },
      ],
    },
  });
  assert.equal(registry.length, 1);
  assert.equal(registry[0].id, receipt.intakeId);

  const detail = await prisma.transactionIntake.findUnique({
    where: { id: receipt.intakeId },
    include: { events: true },
  });
  assert.ok(detail);
  assert.ok(detail.events.some(
    (event: { eventType: string }) => event.eventType === "EXTERNAL_INTAKE_REGISTERED"
  ));
  console.log("PASS: registry query and detail identity");

  await prisma.transactionIntake.update({
    where: { id: receipt.intakeId },
    data: { status: "QUALIFIED" },
  });

  const beforeOpportunities = await prisma.opportunity.count();
  const beforeOpportunityEvents = await prisma.opportunityEvent.count();
  const beforeIntakeEvents = await prisma.transactionIntakeEvent.count({
    where: { intakeId: receipt.intakeId },
  });

  await assert.rejects(
    promoteTransactionIntakeToOpportunity({
      intakeId: receipt.intakeId,
      actorEmail: `${adminId}@example.test`,
    }),
    /FW_TXN_EXTERNAL_PROMOTION_AUTHORITY_REQUIRED/,
  );

  const after = await prisma.transactionIntake.findUniqueOrThrow({
    where: { id: receipt.intakeId },
  });
  assert.equal(after.status, "QUALIFIED");
  assert.equal(after.promotedOpportunityId, null);
  assert.equal(after.promotedAt, null);
  assert.equal(await prisma.opportunity.count(), beforeOpportunities);
  assert.equal(await prisma.opportunityEvent.count(), beforeOpportunityEvents);
  assert.equal(
    await prisma.transactionIntakeEvent.count({
      where: { intakeId: receipt.intakeId },
    }),
    beforeIntakeEvents,
  );
  assert.equal(
    await prisma.transactionIntakeEvent.count({
      where: {
        intakeId: receipt.intakeId,
        eventType: "PROMOTED_TO_OPPORTUNITY",
      },
    }),
    0,
  );

  console.log("PASS: QUALIFIED external intake promotion rejected");
  console.log("PASS: no opportunity, linkage or promotion events");
}

async function cleanup() {
  const intake = createdIntakeId
    ? await prisma.transactionIntake.findUnique({
        where: { id: createdIntakeId },
      })
    : null;

  // Never delete an existing or unrelated record.
  if (intake) {
    assert.ok(intake.internalNotes?.includes(operationalReference));
    assert.equal(intake.promotedOpportunityId, null,
      "STOP: unexpected promotion linkage; preserve fixture for investigation");

    await prisma.transactionIntakeEvent.deleteMany({
      where: { intakeId: intake.id },
    });
    await prisma.transactionIntake.delete({
      where: { id: intake.id },
    });
  }

  await prisma.user.deleteMany({ where: { id: adminId } });
  console.log("PASS: synthetic records cleaned");
}

run()
  .catch(error => {
    console.error("FAIL:", error?.code ?? error?.message ?? String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (error) {
      console.error("FAIL: cleanup:", error);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
      await servicePrisma.$disconnect();
    }
  });
