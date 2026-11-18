import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assessEcoNommoDelegationProvenance,
  type DelegationProvenanceClaim,
} from "./assessEcoNommoDelegationProvenance";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

const at = new Date("2026-11-17T12:00:00.000Z");
const admission: EcoNommoDraftAdmission = {
  actorUserId: "synthetic-holder",
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-MANIFEST",
  sourceEdition: "Review 01",
  instrumentStatus: "DRAFT", versionStatus: "DRAFT",
  title: "Synthetic draft", kind: "GENERAL",
  custodyReference: "synthetic-source-custody",
  sourceSha256: "ab".repeat(32), correlationId: "synthetic-request",
};
const mandate = (): EcoNommoMandateEvidenceCandidate => ({
  mandateReference: "synthetic-mandate",
  issuerInstitutionId: "issuer-institution",
  issuerRepresentativeUserId: "synthetic-issuer",
  representedInstitutionId: "represented-institution",
  holderUserId: "synthetic-holder",
  holderCapacity: "DOCUMENTARY_ADMISSION",
  action: "REGISTER_DRAFT_INSTRUMENT",
  collectionKey: "ECO_NOMMO", libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-MANIFEST", sourceEdition: "Review 01",
  effectiveAt: "2026-11-01T00:00:00.000Z",
  expiresAt: "2026-12-01T00:00:00.000Z",
  revokedAt: null, supersededAt: null,
  evidenceReference: "mandate-evidence", evidenceCustodyReference: "custody-source",
  evidenceSha256: "cd".repeat(32),
  evidenceIssuerAuthenticationReference: "issuer-auth",
  evidenceIssuerCompetenceReference: "issuer-competence",
  evidenceHolderAcceptanceReference: "holder-acceptance",
  evidenceIndependentVerifierReference: "independent-verifier",
});
const trail = (finding: NonNullable<DelegationProvenanceClaim["trail"]>[number]["finding"], sourceId: string) => ({
  finding, sourceId, recordId: "record-" + finding, recorderUserId: "synthetic-recorder",
  observedAt: "2026-11-10T00:00:00.000Z",
});
const claim = (): DelegationProvenanceClaim => ({
  issuerCompetence: {
    institutionId: "issuer-institution", authoritySourceId: "power-source",
    delegationPower: "DOCUMENTARY_DRAFT_ADMISSION",
    effectiveAt: "2026-11-01T00:00:00.000Z",
    expiresAt: "2026-12-01T00:00:00.000Z",
  },
  parties: {
    issuerInstitutionId: "issuer-institution", issuerRepresentativeUserId: "synthetic-issuer",
    representedInstitutionId: "represented-institution",
    holderUserId: "synthetic-holder", holderCapacity: "DOCUMENTARY_ADMISSION",
    issuerIdentitySourceId: "issuer-id", holderIdentitySourceId: "holder-id",
    representationSourceId: "representation-source",
  },
  scope: {
    action: "REGISTER_DRAFT_INSTRUMENT", collectionKey: "ECO_NOMMO",
    libraryReference: "EN-00", sourceReference: "SYNTHETIC-MANIFEST", sourceEdition: "Review 01",
  },
  custody: {
    documentReference: "mandate-evidence", custodySourceId: "custody-source",
    recordedSha256: "cd".repeat(32), recomputedSha256: "cd".repeat(32),
    digestVerificationSourceId: "digest-source", digestVerifierUserId: "synthetic-verifier",
  },
  verifier: {
    userId: "synthetic-verifier", institutionId: "independent-institution",
    competenceSourceId: "verifier-competence", identitySourceId: "verifier-identity",
    independenceSourceId: "independence-source",
  },
  lifecycle: {
    mandateReference: "synthetic-mandate", currentStateSourceId: "lifecycle-source",
    effectiveAt: "2026-11-01T00:00:00.000Z", expiresAt: "2026-12-01T00:00:00.000Z",
    withdrawnAt: null, revokedAt: null, supersededAt: null, suspendedAt: null,
  },
  trail: [
    trail("ISSUER_COMPETENCE", "power-source"),
    trail("ISSUER_IDENTITY", "issuer-id"),
    trail("HOLDER_BINDING", "representation-source"),
    trail("SCOPE", "lifecycle-source"),
    trail("CUSTODY_DIGEST", "digest-source"),
    trail("VERIFIER_COMPETENCE", "verifier-competence"),
    trail("LIFECYCLE", "lifecycle-source"),
  ],
});
const assess = (input: DelegationProvenanceClaim | null, m = mandate()) =>
  assessEcoNommoDelegationProvenance(admission, m, input, at);
function denied(input: DelegationProvenanceClaim | null, reason: string, m = mandate()) {
  const result = assess(input, m);
  assert.equal(result.operativeAuthorityEstablished, false);
  assert.equal(result.admissionAuthorized, false);
  assert.notEqual(result.standing, "INDEPENDENT_AUTHENTICATION_REQUIRED");
  assert.ok(result.reasons.includes(reason), result.reasons.join(", "));
}

test("even a complete synthetic claim NEVER authenticates mandate or permits admission", () => {
  assert.deepEqual(assess(claim()), {
    standing: "INDEPENDENT_AUTHENTICATION_REQUIRED",
    reasons: ["CLAIMS_AND_SOURCE_REFERENCES_ARE_NOT_AUTHENTICATED_PROOF"],
    operativeAuthorityEstablished: false, admissionAuthorized: false,
  });
});

test("missing claim and any of seven evidence groups fail closed", () => {
  denied(null, "PROVENANCE_CLAIM_REQUIRED");
  const c = claim();
  denied({ ...c, issuerCompetence: null }, "ISSUER_COMPETENCE_MISSING");
  denied({ ...c, parties: null }, "PARTY_BINDINGS_MISSING");
  denied({ ...c, scope: null }, "DELEGATION_SCOPE_MISSING");
  denied({ ...c, custody: null }, "CUSTODY_VERIFICATION_MISSING");
  denied({ ...c, verifier: null }, "INDEPENDENT_VERIFIER_MISSING");
  denied({ ...c, lifecycle: null }, "MANDATE_LIFECYCLE_MISSING");
  denied({ ...c, trail: null }, "PROVENANCE_TRAIL_MISSING");
});

test("issuer must have the exact institution and documentary delegation power", () => {
  const c = claim();
  denied({ ...c, issuerCompetence: { ...c.issuerCompetence!, institutionId: "other" } },
    "ISSUER_COMPETENCE_SCOPE_CONFLICT");
  denied({ ...c, issuerCompetence: { ...c.issuerCompetence!, delegationPower: "TRANSFER_FUNDS" as never } },
    "ISSUER_COMPETENCE_SCOPE_CONFLICT");
  denied({ ...c, issuerCompetence: { ...c.issuerCompetence!, authoritySourceId: "" } },
    "ISSUER_COMPETENCE_SOURCE_INCOMPLETE");
  denied({ ...c, issuerCompetence: { ...c.issuerCompetence!, expiresAt: "2026-11-01T00:00:00.000Z" } },
    "ISSUER_COMPETENCE_WINDOW_CONFLICT");
});

test("issuer, holder and represented institution must bind exactly", () => {
  const c = claim();
  denied({ ...c, parties: { ...c.parties!, holderUserId: "other-holder" } },
    "PARTY_BINDING_CONFLICT");
  denied({ ...c, parties: { ...c.parties!, representedInstitutionId: "wrong" } },
    "PARTY_BINDING_CONFLICT");
  denied({ ...c, parties: { ...c.parties!, issuerRepresentativeUserId: "synthetic-holder" } },
    "PARTY_BINDING_CONFLICT");
  denied({ ...c, parties: { ...c.parties!, holderIdentitySourceId: "" } },
    "PARTY_BINDING_SOURCE_INCOMPLETE");
});

test("scope cannot authorize another action, position, edition or issued state", () => {
  const c = claim();
  denied({ ...c, scope: { ...c.scope!, action: "TRANSFER_FUNDS" } },
    "DELEGATION_SCOPE_CONFLICT");
  denied({ ...c, scope: { ...c.scope!, libraryReference: "EN-03" } },
    "DELEGATION_SCOPE_CONFLICT");
  denied({ ...c, scope: { ...c.scope!, sourceEdition: "Final 01" } },
    "DELEGATION_SCOPE_CONFLICT");
  const issued = { ...admission, versionStatus: "ISSUED" } as EcoNommoDraftAdmission;
  const result = assessEcoNommoDelegationProvenance(issued, mandate(), c, at);
  assert.equal(result.operativeAuthorityEstablished, false);
  assert.ok(result.reasons.includes("MANDATE_EXACT_DOCUMENTARY_SCOPE_REQUIRED"));
});

test("custody requires coherent source references and recomputed digest", () => {
  const c = claim();
  denied({ ...c, custody: { ...c.custody!, recomputedSha256: "ee".repeat(32) } },
    "CUSTODY_DIGEST_CONFLICT");
  denied({ ...c, custody: { ...c.custody!, recordedSha256: "bad" } },
    "CUSTODY_DIGEST_INVALID");
  denied({ ...c, custody: { ...c.custody!, custodySourceId: "other" } },
    "CUSTODY_REFERENCE_CONFLICT");
  denied({ ...c, custody: { ...c.custody!, digestVerificationSourceId: "" } },
    "CUSTODY_SOURCE_INCOMPLETE");
});

test("verifier must be distinct from issuer, holder and represented institutions", () => {
  const c = claim();
  denied({ ...c, verifier: { ...c.verifier!, userId: "synthetic-holder" } },
    "VERIFIER_INDEPENDENCE_OR_BINDING_CONFLICT");
  denied({ ...c, verifier: { ...c.verifier!, institutionId: "issuer-institution" } },
    "VERIFIER_INDEPENDENCE_OR_BINDING_CONFLICT");
  denied({ ...c, verifier: { ...c.verifier!, institutionId: "represented-institution" } },
    "VERIFIER_INDEPENDENCE_OR_BINDING_CONFLICT");
  denied({ ...c, verifier: { ...c.verifier!, competenceSourceId: "" } },
    "VERIFIER_PROVENANCE_INCOMPLETE");
});

test("withdrawn, suspended, revoked and superseded mandate never qualifies", () => {
  const c = claim();
  for (const field of ["withdrawnAt", "suspendedAt", "revokedAt", "supersededAt"] as const) {
    denied({ ...c, lifecycle: { ...c.lifecycle!, [field]: "2026-11-10T00:00:00.000Z" } },
      "MANDATE_LIFECYCLE_CONFLICT");
  }
  denied({ ...c, lifecycle: { ...c.lifecycle!, mandateReference: "other" } },
    "MANDATE_LIFECYCLE_CONFLICT");
  denied({ ...c, lifecycle: { ...c.lifecycle!, expiresAt: "2026-11-05T00:00:00.000Z" } },
    "MANDATE_LIFECYCLE_WINDOW_CONFLICT");
});

test("durable trail requires all seven findings, source bindings and attributable records", () => {
  const c = claim();
  denied({ ...c, trail: c.trail!.filter(row => row.finding !== "ISSUER_IDENTITY") },
    "TRAIL_FINDING_MISSING:ISSUER_IDENTITY");
  denied({ ...c, trail: [...c.trail!, c.trail![0]] },
    "DUPLICATE_TRAIL_FINDING");
  denied({ ...c, trail: c.trail!.map(row => row.finding === "LIFECYCLE"
    ? { ...row, sourceId: "incorrect" } : row) },
    "TRAIL_SOURCE_BINDING_CONFLICT:LIFECYCLE");
  denied({ ...c, trail: c.trail!.map(row => row.finding === "ISSUER_IDENTITY"
    ? { ...row, recorderUserId: "" } : row) },
    "TRAIL_RECORD_INVALID");
});

test("documentary candidate is never replaced with claimed source evidence", () => {
  const m = { ...mandate(), holderUserId: "forged-holder" };
  const result = assess(claim(), m);
  assert.equal(result.operativeAuthorityEstablished, false);
  assert.ok(result.reasons.includes("MANDATE_EXACT_DOCUMENTARY_SCOPE_REQUIRED"));
});
