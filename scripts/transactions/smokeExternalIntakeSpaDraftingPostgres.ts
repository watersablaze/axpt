import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@axpt/source-authority-join";
import { SignJWT } from "jose";
import { EventTypes } from "../../src/core/events/types";
import {
  advanceAdoptedExternalIntakeDossierWithClient,
} from "../../src/domains/control-center/dossiers/advanceAdoptedExternalIntakeDossierWithClient";
import {
  DOSSIER_KYC_REVIEW_CONFIRMED_EVENT,
  evaluateDossierKycReadiness,
} from "../../src/domains/control-center/dossiers/dossierKycReview";

const target = "axpt_fw_zkkm_adoption_rehearsal";
for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  const url = new URL(process.env[key] ?? "");
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, "64047");
  assert.equal(url.username, "axpt_rehearsal");
  assert.equal(url.pathname, `/${target}`);
}

const dossierId = process.env.FW_ZKKM_REHEARSAL_DOSSIER;
assert.ok(dossierId);
const db = new PrismaClient();

async function main(id: string) {
  const [identity] = await db.$queryRaw<Array<{ database: string; actor: string }>>`
    SELECT current_database() AS database, current_user AS actor
  `;
  assert.deepEqual(identity, { database: target, actor: "axpt_rehearsal" });
  assert.equal(await db.externalTransactionIntakeAdoption.count(), 1);
  const decision = await db.externalTransactionIntakeAdoption.findFirstOrThrow({
    include: { matter: true, intake: true },
  });
  assert.match(decision.matter.reference, /^REHEARSAL-MAT-/);
  assert.equal(decision.matter.currentRecordId, id);
  assert.equal(decision.matter.currentRecordKind, "DOSSIER");
  const source = await db.transactionIntakeEvent.findUniqueOrThrow({
    where: { id: decision.externalRegistrationEventId },
  });
  const officer = await db.user.findUniqueOrThrow({ where: { id: decision.issuerUserId } });
  assert.match(officer.email, /^adoption-officer-.*@example\.invalid$/);
  const dossier = await db.transactionDossier.findUniqueOrThrow({ where: { id } });
  assert.equal(dossier.state, "INTAKE_PENDING");

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

  const input = {
    client: db,
    dossierId: id,
    adoptionDecisionId: decision.id,
    signingSecret,
    sessionToken,
  };
  const review = () => advanceAdoptedExternalIntakeDossierWithClient({
    ...input, fromState: "INTAKE_PENDING", toState: "KYC_REVIEW",
  });
  const draft = () => advanceAdoptedExternalIntakeDossierWithClient({
    ...input, fromState: "KYC_REVIEW", toState: "SPA_DRAFTING",
  });
  const artifacts = () => db.transactionDossierInstrument.count({
    where: { dossierId: id, type: "SPA" },
  });

  await assert.rejects(draft(), /FW_DOSSIER_EXPECTED_STATE_MISMATCH/);
  assert.equal((await review()).state, "KYC_REVIEW");
  assert.equal((await review()).alreadyTransitioned, true);
  await assert.rejects(draft(), /DOSSIER_ARTIFACT_GATE_BLOCKED/);
  assert.equal(await artifacts(), 0);
  assert.equal(
    (await db.transactionDossier.findUniqueOrThrow({ where: { id } })).state,
    "KYC_REVIEW",
  );
  console.log("PASS KYC review cannot be skipped and drafting requires confirmation");

  const buyer = await db.transactionDossierParty.findFirstOrThrow({
    where: { dossierId: id, role: "BUYER" },
  });
  await db.transactionDossierParty.update({
    where: { id: buyer.id },
    data: {
      representative: "Synthetic Review Contact",
      country: "Synthetic Jurisdiction",
      notes: "Synthetic review context. Buyer signing authority remains unverified.",
    },
  });
  const reviewed = await db.transactionDossier.findUniqueOrThrow({
    where: { id },
    include: { parties: true, promotedOpportunities: true },
  });
  const readiness = evaluateDossierKycReadiness({
    parties: reviewed.parties,
    sourceOpportunities: reviewed.promotedOpportunities,
  });
  assert.ok(readiness.passed, JSON.stringify(readiness.checks));
  await db.transactionDossierEvent.create({
    data: {
      dossierId: id,
      eventType: DOSSIER_KYC_REVIEW_CONFIRMED_EVENT,
      fromState: "KYC_REVIEW",
      toState: "KYC_REVIEW",
      actor: officer.email,
      message: "Synthetic KYC confirmation for transition rehearsal.",
      metadata: { source: "synthetic-rehearsal" },
    },
  });

  const [first, second] = await Promise.all([draft(), draft()]);
  assert.equal(first.state, "SPA_DRAFTING");
  assert.equal(second.state, "SPA_DRAFTING");
  assert.equal(first.eventId, second.eventId);
  assert.equal(Number(first.alreadyTransitioned) + Number(second.alreadyTransitioned), 1);
  assert.equal(await artifacts(), 1);
  const spa = await db.transactionDossierInstrument.findFirstOrThrow({
    where: { dossierId: id, type: "SPA" },
  });
  assert.equal(spa.status, "DRAFT");

  const transitions = await db.transactionDossierEvent.findMany({
    where: { dossierId: id, eventType: EventTypes.DOSSIER_STATE_TRANSITIONED },
    select: { fromState: true, toState: true },
  });
  assert.deepEqual(
    transitions.map(({ fromState, toState }) => `${fromState}:${toState}`).sort(),
    ["INTAKE_PENDING:KYC_REVIEW", "KYC_REVIEW:SPA_DRAFTING"],
  );
  assert.equal(await db.domainEvent.count({
    where: {
      streamType: "DOSSIER",
      streamId: dossier.reference,
      eventType: EventTypes.DOSSIER_STATE_TRANSITIONED,
    },
  }), 2);
  const finalMatter = await db.institutionalMatter.findUniqueOrThrow({
    where: { id: decision.matterId }, include: { records: true },
  });
  assert.equal(finalMatter.reference, decision.matter.reference);
  assert.equal(finalMatter.currentRecordId, id);
  assert.equal(finalMatter.records.length, 3);
  assert.deepEqual(
    await db.transactionIntakeEvent.findUniqueOrThrow({ where: { id: source.id } }),
    source,
  );
  console.log("PASS concurrent drafting yields one draft, one transition, and intact Matter lineage");
}

main(dossierId)
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
