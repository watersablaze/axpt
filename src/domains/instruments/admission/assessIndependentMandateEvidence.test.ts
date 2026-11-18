import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assessIndependentMandateEvidence,
  type MandateEvidenceAuthenticationSources,
} from "./assessIndependentMandateEvidence";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";

const at = new Date("2026-11-18T12:00:00.000Z");
const mandate = (): EcoNommoMandateEvidenceCandidate => ({
  mandateReference: "synthetic-mandate-1",
  issuerInstitutionId: "issuer-institution",
  issuerRepresentativeUserId: "issuer-user",
  representedInstitutionId: "represented-institution",
  holderUserId: "holder-user",
  holderCapacity: "DOCUMENTARY_ADMISSION",
  action: "REGISTER_DRAFT_INSTRUMENT",
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-SOURCE",
  sourceEdition: "Review 01",
  effectiveAt: "2026-11-01T00:00:00.000Z",
  expiresAt: "2026-12-01T00:00:00.000Z",
  revokedAt: null, supersededAt: null,
  evidenceReference: "evidence-1",
  evidenceCustodyReference: "custody-1",
  evidenceSha256: "ab".repeat(32),
  evidenceIssuerAuthenticationReference: "issuer-auth",
  evidenceIssuerCompetenceReference: "issuer-competence",
  evidenceHolderAcceptanceReference: "holder-acceptance",
  evidenceIndependentVerifierReference: "verifier-ref",
});
const sources = (): MandateEvidenceAuthenticationSources => ({
  document: {
    evidenceReference: "evidence-1", custodyReference: "custody-1",
    custodySourceId: "custody-store-1",
    recordedSha256: "ab".repeat(32), observedSha256: "ab".repeat(32),
    digestObservationSourceId: "digest-observation-1",
  },
  issuerAuthentication: {
    issuerUserId: "issuer-user", issuerInstitutionId: "issuer-institution",
    signedDocumentSha256: "ab".repeat(32),
    signatureEvidenceId: "issuer-signature-1",
    credentialSourceId: "issuer-credential-1",
  },
  verifier: {
    userId: "verifier-user", institutionId: "independent-institution",
    identityEvidenceId: "verifier-identity-1",
    competenceEvidenceId: "verifier-competence-1",
    independenceEvidenceId: "verifier-independence-1",
    currentStanding: "ACTIVE",
    reviewedEvidenceReference: "evidence-1",
    reviewedSha256: "ab".repeat(32),
  },
  attestation: {
    mandateReference: "synthetic-mandate-1",
    verifierUserId: "verifier-user",
    evidenceReference: "evidence-1",
    evidenceSourceId: "attestation-record-1",
    observedAt: "2026-11-17T12:00:00.000Z",
  },
});
function rejected(
  input: MandateEvidenceAuthenticationSources | null,
  standing: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED",
  reason: string,
  m: EcoNommoMandateEvidenceCandidate = mandate(),
) {
  const r = assessIndependentMandateEvidence(m, input, at);
  assert.equal(r.standing, standing);
  assert.ok(r.reasons.includes(reason), r.reasons.join(", "));
  assert.equal(r.evidenceAuthenticated, false);
  assert.equal(r.verifierQualified, false);
  assert.equal(r.operativeAuthorityEstablished, false);
  assert.equal(r.admissionAuthorized, false);
}

test("even coherent source claims cannot authenticate evidence or verifier", () => {
  assert.deepEqual(assessIndependentMandateEvidence(mandate(), sources(), at), {
    standing: "INDEPENDENT_VERIFICATION_REQUIRED",
    reasons: ["SOURCE_REFERENCES_AND_DIGEST_OBSERVATIONS_ARE_NOT_AUTHENTICATED"],
    evidenceAuthenticated: false, verifierQualified: false,
    operativeAuthorityEstablished: false, admissionAuthorized: false,
  });
});

test("missing mandate and observations fail closed", () => {
  rejected(null, "SOURCE_INCOMPLETE", "MANDATE_OR_EVIDENCE_SOURCES_MISSING");
  const r = assessIndependentMandateEvidence(null, sources(), at);
  assert.equal(r.standing, "SOURCE_INCOMPLETE");
  assert.equal(r.evidenceAuthenticated, false);
});

test("absent custody and digest observations are incomplete", () => {
  const s = sources();
  rejected({ ...s, document: null }, "SOURCE_INCOMPLETE", "DOCUMENT_CUSTODY_SOURCE_MISSING");
  rejected({ ...s, document: { ...s.document!, custodySourceId: "" } },
    "SOURCE_INCOMPLETE", "DOCUMENT_SOURCE_REFERENCES_INCOMPLETE");
  rejected({ ...s, document: { ...s.document!, observedSha256: "bad" } },
    "SOURCE_INCOMPLETE", "DOCUMENT_DIGEST_INVALID");
});

test("contradictory custody or digest is a conflict", () => {
  const s = sources();
  rejected({ ...s, document: { ...s.document!, custodyReference: "other" } },
    "SOURCE_CONFLICTED", "DOCUMENT_CUSTODY_BINDING_CONFLICT");
  rejected({ ...s, document: { ...s.document!, observedSha256: "cd".repeat(32) } },
    "SOURCE_CONFLICTED", "DOCUMENT_DIGEST_CONFLICT");
});

test("issuer signature must bind exact user, institution, and document digest", () => {
  const s = sources();
  rejected({ ...s, issuerAuthentication: null },
    "SOURCE_INCOMPLETE", "ISSUER_AUTHENTICATION_SOURCE_MISSING");
  rejected({ ...s, issuerAuthentication: { ...s.issuerAuthentication!, issuerUserId: "other" } },
    "SOURCE_CONFLICTED", "ISSUER_SIGNATURE_IDENTITY_CONFLICT");
  rejected({ ...s, issuerAuthentication: { ...s.issuerAuthentication!, signedDocumentSha256: "cd".repeat(32) } },
    "SOURCE_CONFLICTED", "ISSUER_SIGNED_DIGEST_CONFLICT");
  rejected({ ...s, issuerAuthentication: { ...s.issuerAuthentication!, credentialSourceId: "" } },
    "SOURCE_INCOMPLETE", "ISSUER_CREDENTIAL_SOURCE_INCOMPLETE");
});

test("verifier identity and institutional independence are mandatory", () => {
  const s = sources();
  rejected({ ...s, verifier: null }, "SOURCE_INCOMPLETE", "INDEPENDENT_VERIFIER_SOURCE_MISSING");
  rejected({ ...s, verifier: { ...s.verifier!, userId: "issuer-user" } },
    "SOURCE_CONFLICTED", "VERIFIER_NOT_INDEPENDENT");
  rejected({ ...s, verifier: { ...s.verifier!, userId: "holder-user" } },
    "SOURCE_CONFLICTED", "VERIFIER_NOT_INDEPENDENT");
  rejected({ ...s, verifier: { ...s.verifier!, institutionId: "issuer-institution" } },
    "SOURCE_CONFLICTED", "VERIFIER_NOT_INDEPENDENT");
  rejected({ ...s, verifier: { ...s.verifier!, institutionId: "represented-institution" } },
    "SOURCE_CONFLICTED", "VERIFIER_NOT_INDEPENDENT");
});

test("verifier competence, current standing and reviewed digest are checked", () => {
  const s = sources();
  rejected({ ...s, verifier: { ...s.verifier!, competenceEvidenceId: "" } },
    "SOURCE_INCOMPLETE", "VERIFIER_EVIDENCE_REFERENCES_INCOMPLETE");
  rejected({ ...s, verifier: { ...s.verifier!, currentStanding: "INACTIVE" } },
    "SOURCE_CONFLICTED", "VERIFIER_STANDING_INACTIVE");
  rejected({ ...s, verifier: { ...s.verifier!, reviewedSha256: "cd".repeat(32) } },
    "SOURCE_CONFLICTED", "VERIFIER_REVIEWED_DIGEST_CONFLICT");
  rejected({ ...s, verifier: { ...s.verifier!, reviewedEvidenceReference: "other" } },
    "SOURCE_CONFLICTED", "VERIFIER_DOCUMENT_BINDING_CONFLICT");
});

test("absent verifier does not generate a fabricated attestation conflict", () => {
  const s = sources();
  rejected({ ...s, verifier: null }, "SOURCE_INCOMPLETE", "INDEPENDENT_VERIFIER_SOURCE_MISSING");
});

test("attestation must bind exact mandate, evidence, verifier and valid time", () => {
  const s = sources();
  rejected({ ...s, attestation: null }, "SOURCE_INCOMPLETE", "INDEPENDENT_ATTESTATION_MISSING");
  rejected({ ...s, attestation: { ...s.attestation!, verifierUserId: "other" } },
    "SOURCE_CONFLICTED", "ATTESTATION_BINDING_CONFLICT");
  rejected({ ...s, attestation: { ...s.attestation!, mandateReference: "other" } },
    "SOURCE_CONFLICTED", "ATTESTATION_BINDING_CONFLICT");
  rejected({ ...s, attestation: { ...s.attestation!, observedAt: "2026-11-19T00:00:00.000Z" } },
    "SOURCE_INCOMPLETE", "ATTESTATION_TIME_NOT_VALID");
});

test("invalid assessment time never creates an authenticated outcome", () => {
  const r = assessIndependentMandateEvidence(mandate(), sources(), new Date(NaN));
  assert.equal(r.standing, "SOURCE_CONFLICTED");
  assert.ok(r.reasons.includes("ASSESSMENT_TIME_INVALID"));
  assert.equal(r.evidenceAuthenticated, false);
  assert.equal(r.admissionAuthorized, false);
});
