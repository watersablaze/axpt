import {
  promoteAdoptedExternalTransactionIntakeToOpportunity,
  promoteTransactionIntakeToOpportunityWithClient,
} from "../../src/domains/control-center/transaction-intakes/promoteTransactionIntakeToOpportunity";

import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@axpt/source-authority-join";
import { SignJWT } from "jose";

import {
  FRENCH_WARD_INSTITUTIONAL_PROFILE,
} from "../../src/domains/institutions/french-ward/canonicalInstitutionalProfile";
import {
  adoptExternalTransactionIntakeForPromotionWithClient,
} from "../../src/domains/control-center/transaction-intakes/adoptExternalTransactionIntakeForPromotionWithClient";
import {
  registerExternalIntakeWithClient,
} from "../../src/domains/control-center/transaction-intakes/registerExternalIntakeWithClient";

const target = "axpt_fw_zkkm_adoption_rehearsal";
assert.match(process.env.FW_ZKKM_REHEARSAL_CONTAINER_ID ?? "", /^[a-f0-9]{64}$/);
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
  assert.equal(await db.externalTransactionIntakeAdoption.count(), 0);
  assert.equal(
    await db.frenchWardGoverningOfficer.count({ where: { reference: "FW-GOV-002" } }),
    0,
  );

  const nonce = randomUUID();
  const user = await db.user.create({
    data: {
      username: `adoption-officer-${nonce}`,
      email: `adoption-officer-${nonce}@example.invalid`,
      passwordHash: "SYNTHETIC-NONLOGIN",
      viewedDocs: [],
    },
  });
  await db.frenchWardGoverningOfficer.create({
    data: {
      userId: user.id,
      reference: "FW-GOV-002",
      displayName: "Synthetic Adoption Officer",
      institutionalTitle: "Rehearsal Officer",
      governingBasis: "Synthetic rehearsal fixture",
    },
  });

  const signingSecret = randomBytes(32);
  const tokenId = randomUUID();
  const expiresAt = new Date(Date.now() + 900_000);
  const sessionToken = await new SignJWT({
    userId: user.id,
    tokenId,
    tier: "french-ward-governance",
    email: user.email,
    displayName: "Synthetic Adoption Officer",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(signingSecret);

  const registrar = await db.user.create({
    data: {
      username: `adoption-registrar-${nonce}`,
      email: `adoption-registrar-${nonce}@example.invalid`,
      passwordHash: "SYNTHETIC-NONLOGIN",
      isAdmin: true,
      viewedDocs: [],
    },
  });
  const evidenceBytes = Buffer.from(`Synthetic adoption evidence ${nonce}`);
  const evidenceSha256 = createHash("sha256").update(evidenceBytes).digest("hex");
  const source = await registerExternalIntakeWithClient(db, {
    operationalReference: `FW-TXN-ADOPTION-TEST-${nonce}`,
    operatorUserId: registrar.id,
    source: "EXTERNAL_EMAIL",
    sourceEvidenceReference: `test-custody/${nonce}/evidence`,
    sourceEvidenceSha256: evidenceSha256,
    evidenceBytes,
    submitterName: "Synthetic Intermediary",
    submitterEmail: "synthetic-intermediary@example.invalid",
    submitterRole: "INTERMEDIARY_UNVERIFIED",
    buyerName: "SYNTHETIC BUYER",
    commodity: "Synthetic Commodity",
    trialQuantity: "50 kg",
    monthlyQuantity: "100 kg",
    destination: "Synthetic Destination",
    originatingCandidateName: "Synthetic Candidate",
    deliveryTerms: "Synthetic delivery",
    settlementMethod: "Synthetic settlement",
  });
  await db.transactionIntake.update({
    where: { id: source.intakeId },
    data: { status: "QUALIFIED" },
  });
  const originalRegistration = await db.transactionIntakeEvent.findFirstOrThrow({
    where: { intakeId: source.intakeId, eventType: "EXTERNAL_INTAKE_REGISTERED" },
  });
  const matter = await db.institutionalMatter.create({
    data: {
      reference: `REHEARSAL-MAT-${nonce}`,
      institutionalDomain: "FRENCH_WARD",
      institutionalPrincipal: FRENCH_WARD_INSTITUTIONAL_PROFILE.legalName,
      coordinationEnvironment: "AXPT",
      matterKind: "COMMERCIAL_TRANSACTION",
      currentRecordKind: "INTAKE",
      currentRecordId: source.intakeId,
      currentRecordReference: source.intakeReference,
      records: {
        create: {
          recordKind: "INTAKE",
          recordId: source.intakeId,
          recordReference: source.intakeReference,
        },
      },
    },
    include: { records: true },
  });

  const input = {
    client: db,
    sessionToken,
    signingSecret,
    intakeId: source.intakeId,
    matterId: matter.id,
    reviewedCoordinationAuthorityReference: `rehearsal/${nonce}/authority`,
    provenanceFindings: "Synthetic source reviewed. Buyer authority remains unverified.",
  };
  const adopt = () => adoptExternalTransactionIntakeForPromotionWithClient(input);

  await assert.rejects(adopt(), /FW_EXTERNAL_ADOPTION_SESSION_REQUIRED/);
  await db.session.create({
    data: { userId: user.id, tokenId, status: "active", expiresAt },
  });
  await assert.rejects(adopt(), /FW_EXTERNAL_ADOPTION_SCOPE_REQUIRED/);
  assert.equal(await db.externalTransactionIntakeAdoption.count(), 0);
  console.log("PASS persisted session and explicit canonical binding required");

  await db.institutionalMatterRecord.update({
    where: { id: matter.records[0].id },
    data: {
      canonicalPrincipalReference: FRENCH_WARD_INSTITUTIONAL_PROFILE.reference,
      canonicalBindingEvidenceReference: `rehearsal/${nonce}/binding`,
    },
  });
  await assert.rejects(
    adoptExternalTransactionIntakeForPromotionWithClient({ ...input, matterId: `wrong-${nonce}` }),
    /FW_EXTERNAL_ADOPTION_SCOPE_REQUIRED/,
  );

  const [first, second] = await Promise.all([adopt(), adopt()]);
  assert.equal(first.decisionId, second.decisionId);
  assert.equal(Number(first.alreadyAdopted) + Number(second.alreadyAdopted), 1);
  assert.equal(await db.externalTransactionIntakeAdoption.count(), 1);
  assert.equal(await db.institutionalMatterEvent.count({
    where: { matterId: matter.id, eventType: "EXTERNAL_INTAKE_ADOPTED" },
  }), 1);
  await assert.rejects(
    adoptExternalTransactionIntakeForPromotionWithClient({
      ...input,
      provenanceFindings: "Changed decision lineage",
    }),
    /FW_EXTERNAL_ADOPTION_DECISION_CONFLICT/,
  );
  console.log("PASS concurrent replay yields one decision and one audit event");

  await db.frenchWardGoverningOfficer.update({
    where: { userId: user.id },
    data: { endedAt: new Date() },
  });
  await assert.rejects(adopt(), /FW_EXTERNAL_ADOPTION_AUTHORITY_REQUIRED/);
  assert.equal(await db.externalTransactionIntakeAdoption.count(), 1);
  const retained = await db.transactionIntake.findUniqueOrThrow({
    where: { id: source.intakeId },
  });
  assert.equal(retained.status, "QUALIFIED");
  assert.equal(retained.promotedOpportunityId, null);
  assert.deepEqual(
    await db.transactionIntakeEvent.findUniqueOrThrow({
      where: { id: originalRegistration.id },
    }),
    originalRegistration,
  );
  console.log("PASS ended standing blocks retry and preserves the decision and source provenance");

  const promotionInput = {
    client: db,
    intakeId: source.intakeId,
    matterId: matter.id,
    adoptionDecisionId: first.decisionId,
    sessionToken,
    signingSecret,
  };
  const promote = () => promoteAdoptedExternalTransactionIntakeToOpportunity(promotionInput);

  await assert.rejects(promote(), /FW_EXTERNAL_PROMOTION_GOVERNING_AUTHORITY_REQUIRED/);
  await db.frenchWardGoverningOfficer.update({
    where: { userId: user.id },
    data: { endedAt: null },
  });
  await assert.rejects(promote(), /FW_EXTERNAL_PROMOTION_PERMISSION_REQUIRED/);

  const role = await db.role.create({
    data: { key: `REHEARSAL_PROMOTION_${nonce}`, label: "Synthetic Promotion Grant" },
  });
  const permission = await db.permission.create({
    data: { key: "TRANSACTION_INTAKE_PROMOTE", label: "Synthetic Intake Promotion" },
  });
  await db.rolePermission.create({
    data: { roleId: role.id, permissionId: permission.id },
  });
  const grant = await db.userRole.create({
    data: { userId: user.id, roleId: role.id, isActive: false, revokedAt: new Date() },
  });
  await assert.rejects(promote(), /FW_EXTERNAL_PROMOTION_PERMISSION_REQUIRED/);
  await db.userRole.update({
    where: { id: grant.id },
    data: { isActive: true, revokedAt: null },
  });

  await assert.rejects(
    promoteTransactionIntakeToOpportunityWithClient(db, { intakeId: source.intakeId }),
    /FW_TXN_EXTERNAL_PROMOTION_AUTHORITY_REQUIRED/,
  );
  await assert.rejects(
    promoteAdoptedExternalTransactionIntakeToOpportunity({
      ...promotionInput,
      adoptionDecisionId: randomUUID(),
    }),
    /FW_EXTERNAL_PROMOTION_ADOPTION_MISMATCH/,
  );
  assert.equal(await db.opportunity.count(), 0);
  console.log("PASS promotion requires current standing, effective permission, and exact decision");

  const [promoted, replay] = await Promise.all([promote(), promote()]);
  assert.equal(promoted.opportunityId, replay.opportunityId);
  assert.equal(Number(promoted.alreadyPromoted) + Number(replay.alreadyPromoted), 1);
  assert.equal(await db.opportunity.count(), 1);

  const advanced = await db.institutionalMatter.findUniqueOrThrow({
    where: { id: matter.id },
    include: { records: true },
  });
  assert.equal(advanced.reference, matter.reference);
  assert.equal(advanced.currentRecordKind, "OPPORTUNITY");
  assert.equal(advanced.currentRecordId, promoted.opportunityId);
  assert.equal(advanced.records.length, 2);
  assert.ok(advanced.records.some(
    (record) => record.recordKind === "INTAKE" && record.recordId === source.intakeId,
  ));
  assert.equal(await db.institutionalMatterEvent.count({
    where: { matterId: matter.id, eventType: "CURRENT_RECORD_ADVANCED" },
  }), 1);
  assert.deepEqual(
    await db.transactionIntakeEvent.findUniqueOrThrow({
      where: { id: originalRegistration.id },
    }),
    originalRegistration,
  );
  console.log("PASS concurrent promotion creates one Opportunity on the original Matter");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
