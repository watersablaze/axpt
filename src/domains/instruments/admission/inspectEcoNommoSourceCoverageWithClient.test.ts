import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inspectEcoNommoSourceCoverageWithClient,
  type EcoNommoCoverageKey,
} from "./inspectEcoNommoSourceCoverageWithClient";
import type { EcoNommoSourceAssemblyClient } from "./assembleEcoNommoReadOnlySourcesWithClient";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";
import type { MandateCurrentnessSnapshot } from "./assessEcoNommoMandateCurrentness";

const at = new Date("2026-11-18T12:00:00.000Z");
const admission = {
  actorUserId: "holder-user", collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00", sourceReference: "SYNTHETIC-SOURCE",
  sourceEdition: "Review 01", instrumentStatus: "DRAFT",
  versionStatus: "DRAFT",
} as const;
const mandate: EcoNommoMandateEvidenceCandidate = {
  mandateReference: "synthetic-mandate",
  issuerInstitutionId: "issuer-institution", issuerRepresentativeUserId: "issuer-user",
  representedInstitutionId: "represented-institution", holderUserId: "holder-user",
  holderCapacity: "DOCUMENTARY_ADMISSION", action: "REGISTER_DRAFT_INSTRUMENT",
  collectionKey: "ECO_NOMMO", libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-SOURCE", sourceEdition: "Review 01",
  effectiveAt: "2026-11-01T00:00:00.000Z",
  expiresAt: "2026-12-01T00:00:00.000Z", revokedAt: null, supersededAt: null,
  evidenceReference: "evidence", evidenceCustodyReference: "custody",
  evidenceSha256: "ab".repeat(32), evidenceIssuerAuthenticationReference: "issuer-auth",
  evidenceIssuerCompetenceReference: "issuer-competence",
  evidenceHolderAcceptanceReference: "holder-acceptance",
  evidenceIndependentVerifierReference: "verifier",
};
function client(options: { holder?: boolean; issuer?: boolean; inactive?: boolean; fail?: boolean } = {}) {
  const reads: string[] = [];
  const fake = {
    frenchWardInstitutionalParticipant: {
      findUnique: async ({ where }: { where: { userId: string } }) => {
        reads.push("holder:" + where.userId);
        if (options.fail) throw new Error("SYNTHETIC_READ_ERROR");
        if (options.holder === false) return null;
        return { userId: "holder-user", reference: "FW-USER", displayName: "Synthetic",
          institutionalTitle: "not authority", secondaryTitle: null,
          capacityClass: "REPRESENTATIVE", recognitionBasis: "historical",
          provenanceReference: "unverified", recognizedAt: at,
          status: options.inactive ? "INACTIVE" : "ACTIVE",
          endedAt: options.inactive ? at : null };
      },
    },
    frenchWardGoverningOfficer: {
      findUnique: async ({ where }: { where: { userId: string } }) => {
        reads.push("issuer:" + where.userId);
        if (options.issuer === false) return null;
        return { userId: "issuer-user", reference: "FW-OFFICER",
          displayName: "Synthetic", institutionalTitle: "not competence",
          secondaryTitle: null, governingBasis: "documentary",
          provenanceReference: "unverified", recognizedAt: at,
          status: "ACTIVE", endedAt: null };
      },
    },
  } as unknown as EcoNommoSourceAssemblyClient;
  return { fake, reads };
}
const keys: EcoNommoCoverageKey[] = [
  "ISSUER_COMPETENCE", "INSTITUTIONAL_BINDINGS", "DOCUMENT_SCOPE",
  "CUSTODY_DIGEST", "INDEPENDENT_VERIFIER", "MANDATE_CURRENTNESS",
  "DURABLE_PROVENANCE",
];
function noGrant(result: Awaited<ReturnType<typeof inspectEcoNommoSourceCoverageWithClient>>) {
  assert.equal(result.operativeAuthorityEstablished, false);
  assert.equal(result.admissionAuthorized, false);
  assert.deepEqual(result.findings.map(item => item.key), keys);
  assert.ok(result.findings.every(item => item.authenticated === false));
  assert.ok(result.findings.every(item => item.gaps.length > 0));
}
test("active institutional recognitions supply only structural coverage", async () => {
  const { fake, reads } = client();
  const result = await inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "holder-user", admission, candidate: mandate, at,
  });
  assert.deepEqual(reads, ["holder:holder-user", "issuer:issuer-user"]);
  assert.equal(result.findings[1].coverage, "STRUCTURAL_ONLY");
  assert.equal(result.findings[4].coverage, "MISSING");
  assert.equal(result.decisions.identities, "SOURCE_INCOMPLETE");
  assert.equal(result.decisions.evidence, "SOURCE_INCOMPLETE");
  assert.equal(result.decisions.currentness, "SOURCE_INCOMPLETE");
  noGrant(result);
});
test("missing holder recognition does not imply institution binding", async () => {
  const { fake } = client({ holder: false });
  const result = await inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "holder-user", admission, candidate: mandate, at,
  });
  assert.equal(result.findings[1].coverage, "MISSING");
  assert.ok(result.sourceWarnings.includes("HOLDER_RECOGNITION_NOT_FOUND"));
  noGrant(result);
});
test("inactive holder remains missing for safe coverage purposes", async () => {
  const { fake } = client({ inactive: true });
  const result = await inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "holder-user", admission, candidate: mandate, at,
  });
  assert.equal(result.findings[1].coverage, "MISSING");
  assert.ok(result.sourceWarnings.includes("HOLDER_RECOGNITION_INACTIVE"));
  noGrant(result);
});
test("missing issuer governing recognition never becomes issuer competence", async () => {
  const { fake } = client({ issuer: false });
  const result = await inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "holder-user", admission, candidate: mandate, at,
  });
  assert.equal(result.findings[1].coverage, "MISSING");
  assert.equal(result.findings[0].coverage, "MISSING");
  noGrant(result);
});
test("mismatched actor does not initiate institutional reads", async () => {
  const { fake, reads } = client();
  const result = await inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "other-actor", admission, candidate: mandate, at,
  });
  assert.deepEqual(reads, []);
  assert.equal(result.findings[1].coverage, "MISSING");
  assert.ok(result.sourceWarnings.includes("VERIFIED_SESSION_ACTOR_NOT_BOUND"));
  noGrant(result);
});
test("synthetic complete flag cannot turn currentness into authority", async () => {
  const { fake } = client();
  const snapshot: MandateCurrentnessSnapshot = {
    complete: true, sourceReference: "unverified-record-set",
    records: [{
      recordId: "r1", mandateReference: mandate.mandateReference,
      issuerInstitutionId: mandate.issuerInstitutionId,
      representedInstitutionId: mandate.representedInstitutionId,
      holderUserId: mandate.holderUserId, action: mandate.action,
      collectionKey: mandate.collectionKey, libraryReference: mandate.libraryReference,
      sourceReference: mandate.sourceReference, sourceEdition: mandate.sourceEdition,
      effectiveAt: mandate.effectiveAt, expiresAt: mandate.expiresAt,
      withdrawnAt: null, suspendedAt: null, revokedAt: null,
      supersededByReference: null, lifecycleSourceId: "unverified-source",
    }],
  };
  const result = await inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "holder-user", admission, candidate: mandate, at,
    currentnessSnapshot: snapshot,
  });
  assert.equal(result.decisions.currentness, "CURRENTNESS_AUTHENTICATION_REQUIRED");
  assert.equal(result.findings[5].coverage, "UNQUALIFIED");
  noGrant(result);
});
test("competing same-scope mandate is explicitly conflicted", async () => {
  const { fake } = client();
  const base = {
    recordId: "r1", mandateReference: mandate.mandateReference,
    issuerInstitutionId: mandate.issuerInstitutionId,
    representedInstitutionId: mandate.representedInstitutionId,
    holderUserId: mandate.holderUserId, action: mandate.action,
    collectionKey: mandate.collectionKey, libraryReference: mandate.libraryReference,
    sourceReference: mandate.sourceReference, sourceEdition: mandate.sourceEdition,
    effectiveAt: mandate.effectiveAt, expiresAt: mandate.expiresAt,
    withdrawnAt: null, suspendedAt: null, revokedAt: null,
    supersededByReference: null, lifecycleSourceId: "unverified-source",
  };
  const result = await inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "holder-user", admission, candidate: mandate, at,
    currentnessSnapshot: { complete: true, sourceReference: "unverified",
      records: [base, { ...base, recordId: "r2", mandateReference: "competing" }] },
  });
  assert.equal(result.decisions.currentness, "SOURCE_CONFLICTED");
  noGrant(result);
});
test("source read failures propagate rather than turn into missing evidence", async () => {
  const { fake } = client({ fail: true });
  await assert.rejects(inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "holder-user", admission, candidate: mandate, at,
  }), /SYNTHETIC_READ_ERROR/);
});
test("even an absent mandate cannot populate false authenticated coverage", async () => {
  const { fake } = client();
  const result = await inspectEcoNommoSourceCoverageWithClient({
    client: fake, sessionUserId: "holder-user", admission, candidate: null, at,
  });
  assert.equal(result.decisions.evidence, "SOURCE_INCOMPLETE");
  assert.equal(result.decisions.currentness, "SOURCE_INCOMPLETE");
  noGrant(result);
});
