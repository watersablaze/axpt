import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { PrismaClient } from "@axpt/source-authority-join";
import {
  promoteAdoptedOpportunityToDossierWithClient,
  promoteOpportunityToDossierWithClient,
} from "../../src/domains/control-center/opportunities/promoteOpportunityToDossier";

const target = "axpt_fw_zkkm_adoption_rehearsal";
for (const key of ["DATABASE_URL", "DIRECT_URL"] as const) {
  const url = new URL(process.env[key] ?? "");
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, process.env.FW_ZKKM_REHEARSAL_PORT);
  assert.equal(url.username, "axpt_rehearsal");
  assert.equal(url.pathname, `/${target}`);
}
const db = new PrismaClient();

async function main() {
  const [identity] = await db.$queryRaw<Array<{ database: string; actor: string }>>`
    SELECT current_database() AS database, current_user AS actor
  `;
  assert.deepEqual(identity, { database: target, actor: "axpt_rehearsal" });
  assert.equal(await db.externalTransactionIntakeAdoption.count(), 1);
  assert.equal(await db.opportunity.count(), 1);
  assert.equal(await db.transactionDossier.count(), 0);

  const [adoption] = await db.externalTransactionIntakeAdoption.findMany({
    include: { intake: { include: { promotedOpportunity: true } }, matter: true },
  });
  const { intake, matter } = adoption;
  const opportunity = intake.promotedOpportunity;
  assert.ok(opportunity);
  assert.match(matter.reference, /^REHEARSAL-MAT-/);
  assert.equal(matter.currentRecordKind, "OPPORTUNITY");
  assert.equal(matter.currentRecordId, opportunity.id);
  assert.equal(matter.currentRecordReference, opportunity.id);
  assert.equal(opportunity.status, "INTAKE");
  assert.equal(opportunity.promotedDossierId, null);

  const officer = await db.user.findUniqueOrThrow({
    where: { id: adoption.issuerUserId },
  });
  assert.match(officer.email, /^adoption-officer-.*@example[.]invalid$/);

  const tokenId = randomUUID();
  const signingSecret = randomBytes(32);
  const expiresAt = new Date(Date.now() + 900_000);
  await db.session.create({
    data: { tokenId, userId: officer.id, status: "active", expiresAt },
  });
  const sessionToken = await new SignJWT({
    userId: officer.id,
    tokenId,
    email: officer.email,
    tier: "french-ward-governance",
    displayName: "Synthetic Adoption Officer",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(signingSecret);

  const authorization = { adoptionDecisionId: adoption.id, sessionToken, signingSecret };
  const promote = () =>
    promoteAdoptedOpportunityToDossierWithClient(db, opportunity.id, authorization);
  const ordinaryPromote = () => promoteOpportunityToDossierWithClient(db, {
    opportunityId: opportunity.id,
    operatorEmail: officer.email,
  });
  await assert.rejects(promote(), /OPPORTUNITY_NOT_APPROVED/);
  assert.equal(await db.transactionDossier.count(), 0);
  console.log("PASS unapproved Opportunity cannot create a Dossier");

  // Synthetic fixture setup for this persistence test.
  await db.opportunity.update({ where: { id: opportunity.id }, data: { status: "APPROVED" } });
  await assert.rejects(ordinaryPromote(), /FW_EXTERNAL_DOSSIER_AUTHORITY_REQUIRED/);
  await assert.rejects(
    promoteAdoptedOpportunityToDossierWithClient(db, opportunity.id, {
      ...authorization,
      adoptionDecisionId: randomUUID(),
    }),
    /FW_DOSSIER_ADOPTION_MISMATCH/,
  );
  assert.equal(await db.transactionDossier.count(), 0);
  console.log("PASS ordinary external Dossier creation denied and exact adoption required");
  await db.institutionalMatter.update({
    where: { id: matter.id },
    data: { currentRecordReference: `REHEARSAL-CONFLICT-${opportunity.id}` },
  });
  try {
    await assert.rejects(promote(), /FW_DOSSIER_MATTER_ADVANCEMENT_CONFLICT/);
    assert.equal(await db.transactionDossier.count(), 0);
    assert.equal(await db.transactionDossierEvent.count(), 0);
    const afterConflict = await db.opportunity.findUniqueOrThrow({ where: { id: opportunity.id } });
    assert.equal(afterConflict.status, "APPROVED");
    assert.equal(afterConflict.promotedDossierId, null);
    assert.equal(await db.opportunityEvent.count({
      where: { opportunityId: opportunity.id, type: "OPPORTUNITY_PROMOTED" },
    }), 0);
  } finally {
    await db.institutionalMatter.update({
      where: { id: matter.id },
      data: { currentRecordReference: opportunity.id },
    });
  }
  console.log("PASS Matter conflict rolls back the Dossier, origin pointer, and audit");

  const [first, second] = await Promise.all([promote(), promote()]);
  assert.equal(first.dossierId, second.dossierId);
  assert.equal(Number(first.alreadyPromoted) + Number(second.alreadyPromoted), 1);
  assert.equal(await db.transactionDossier.count(), 1);

  const dossier = await db.transactionDossier.findUniqueOrThrow({ where: { id: first.dossierId } });
  assert.equal(dossier.state, "INTAKE_PENDING");
  const advanced = await db.institutionalMatter.findUniqueOrThrow({
    where: { id: matter.id }, include: { records: true },
  });
  assert.equal(advanced.reference, matter.reference);
  assert.equal(advanced.currentRecordKind, "DOSSIER");
  assert.equal(advanced.currentRecordId, dossier.id);
  assert.equal(advanced.currentRecordReference, dossier.reference);
  assert.deepEqual(
    advanced.records.map(({ recordKind, recordId }) => `${recordKind}:${recordId}`).sort(),
    [`DOSSIER:${dossier.id}`, `INTAKE:${intake.id}`, `OPPORTUNITY:${opportunity.id}`].sort(),
  );
  assert.equal(await db.opportunityEvent.count({
    where: { opportunityId: opportunity.id, type: "OPPORTUNITY_PROMOTED" },
  }), 1);
  assert.equal(await db.institutionalMatterEvent.count({
    where: { matterId: matter.id, eventType: "CURRENT_RECORD_ADVANCED" },
  }), 2);
  console.log("PASS concurrent creation yields one Dossier on the original Matter");
  console.log(`REHEARSAL_DOSSIER=${dossier.id}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
