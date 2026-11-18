import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assessInstitutionalDelegationIdentityBinding,
  type InstitutionalDelegationIdentitySources,
} from "./assessInstitutionalDelegationIdentityBinding";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";

const admission = { actorUserId: "holder-1" };
const mandate = (): EcoNommoMandateEvidenceCandidate => ({
  mandateReference: "synthetic-mandate",
  issuerInstitutionId: "issuer-institution",
  issuerRepresentativeUserId: "issuer-1",
  representedInstitutionId: "represented-institution",
  holderUserId: "holder-1",
  holderCapacity: "DOCUMENTARY_ADMISSION",
  action: "REGISTER_DRAFT_INSTRUMENT",
  collectionKey: "ECO_NOMMO", libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-001", sourceEdition: "Review 01",
  effectiveAt: "2026-11-01T00:00:00.000Z",
  expiresAt: "2026-12-01T00:00:00.000Z",
  revokedAt: null, supersededAt: null,
  evidenceReference: "evidence-1", evidenceCustodyReference: "custody-1",
  evidenceSha256: "ab".repeat(32),
  evidenceIssuerAuthenticationReference: "issuer-auth",
  evidenceIssuerCompetenceReference: "issuer-competence",
  evidenceHolderAcceptanceReference: "holder-acceptance",
  evidenceIndependentVerifierReference: "verifier-source",
});
const sources = (): InstitutionalDelegationIdentitySources => ({
  sessionUserId: "holder-1",
  issuer: {
    userId: "issuer-1", institutionId: "issuer-institution",
    identitySourceId: "issuer-user-source",
    institutionBindingSourceId: "issuer-institution-source",
    standing: "ACTIVE",
  },
  holder: {
    userId: "holder-1", institutionId: "represented-institution",
    identitySourceId: "holder-user-source",
    institutionBindingSourceId: "holder-institution-source",
    capacity: "DOCUMENTARY_ADMISSION",
    capacitySourceId: "holder-capacity-source",
    standing: "ACTIVE",
  },
  representedInstitution: {
    institutionId: "represented-institution",
    institutionalIdentitySourceId: "represented-identity-source",
  },
  issuerCompetenceSourceId: "issuer-competence-source",
  delegationSourceId: "delegation-evidence-source",
});
function check(
  input: InstitutionalDelegationIdentitySources | null,
  expectedStanding: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED",
  expectedReason: string,
  m: EcoNommoMandateEvidenceCandidate = mandate(),
) {
  const r = assessInstitutionalDelegationIdentityBinding(admission, m, input);
  assert.equal(r.standing, expectedStanding);
  assert.equal(r.admissionAuthorized, false);
  assert.equal(r.operativeAuthorityEstablished, false);
  assert.ok(r.reasons.includes(expectedReason), r.reasons.join(", "));
}

test("all aligned identities still require independent authentication", () => {
  assert.deepEqual(assessInstitutionalDelegationIdentityBinding(admission, mandate(), sources()), {
    standing: "AUTHENTICATION_REQUIRED",
    reasons: ["CANONICAL_BINDINGS_NOT_INDEPENDENTLY_AUTHENTICATED"],
    operativeAuthorityEstablished: false, admissionAuthorized: false,
  });
});

test("missing mandate and sources always fail closed", () => {
  check(null, "SOURCE_INCOMPLETE", "MANDATE_OR_BINDING_SOURCES_MISSING");
  const r = assessInstitutionalDelegationIdentityBinding(admission, null, sources());
  assert.equal(r.standing, "SOURCE_INCOMPLETE");
  assert.equal(r.admissionAuthorized, false);
});

test("authenticated session identity binds to admission and mandate holder", () => {
  check({ ...sources(), sessionUserId: "someone-else" },
    "SOURCE_CONFLICTED", "AUTHENTICATED_ACTOR_MISMATCH");
  check({ ...sources(), sessionUserId: null },
    "SOURCE_INCOMPLETE", "AUTHENTICATED_ACTOR_REQUIRED");
  check(sources(), "SOURCE_CONFLICTED", "AUTHENTICATED_ACTOR_MISMATCH",
    { ...mandate(), holderUserId: "other-user" });
});

test("issuer identity must bind canonical user and issuing institution", () => {
  const s = sources();
  check({ ...s, issuer: null }, "SOURCE_INCOMPLETE", "ISSUER_IDENTITY_BINDING_MISSING");
  check({ ...s, issuer: { ...s.issuer!, userId: "other-issuer" } },
    "SOURCE_CONFLICTED", "ISSUER_BINDING_CONFLICT");
  check({ ...s, issuer: { ...s.issuer!, institutionId: "other-institution" } },
    "SOURCE_CONFLICTED", "ISSUER_BINDING_CONFLICT");
  check({ ...s, issuer: { ...s.issuer!, identitySourceId: "" } },
    "SOURCE_INCOMPLETE", "ISSUER_BINDING_SOURCE_INCOMPLETE");
});

test("holder identity, representation and capacity remain exact", () => {
  const s = sources();
  check({ ...s, holder: null }, "SOURCE_INCOMPLETE", "HOLDER_IDENTITY_BINDING_MISSING");
  check({ ...s, holder: { ...s.holder!, institutionId: "other-institution" } },
    "SOURCE_CONFLICTED", "HOLDER_BINDING_CONFLICT");
  check({ ...s, holder: { ...s.holder!, capacity: "FINANCIAL_TRANSFER" } },
    "SOURCE_CONFLICTED", "HOLDER_BINDING_CONFLICT");
  check({ ...s, holder: { ...s.holder!, capacitySourceId: "" } },
    "SOURCE_INCOMPLETE", "HOLDER_BINDING_SOURCE_INCOMPLETE");
});

test("represented institution must have its own canonical source", () => {
  const s = sources();
  check({ ...s, representedInstitution: null },
    "SOURCE_INCOMPLETE", "REPRESENTED_INSTITUTION_MISSING");
  check({ ...s, representedInstitution: { ...s.representedInstitution!, institutionId: "other" } },
    "SOURCE_CONFLICTED", "REPRESENTED_INSTITUTION_CONFLICT");
  check({ ...s, representedInstitution: { ...s.representedInstitution!, institutionalIdentitySourceId: "" } },
    "SOURCE_INCOMPLETE", "REPRESENTED_INSTITUTION_SOURCE_INCOMPLETE");
});

test("issuer and holder cannot be the same actor", () => {
  const s = sources();
  check({ ...s, issuer: { ...s.issuer!, userId: "holder-1" } },
    "SOURCE_CONFLICTED", "ISSUER_HOLDER_MUST_BE_DISTINCT");
});

test("inactive issuer or holder cannot qualify", () => {
  const s = sources();
  check({ ...s, issuer: { ...s.issuer!, standing: "INACTIVE" } },
    "SOURCE_CONFLICTED", "ISSUER_STANDING_INACTIVE");
  check({ ...s, holder: { ...s.holder!, standing: "INACTIVE" } },
    "SOURCE_CONFLICTED", "HOLDER_STANDING_INACTIVE");
});

test("issuer competence and delegation source references are mandatory but never self-authenticating", () => {
  const s = sources();
  check({ ...s, issuerCompetenceSourceId: null },
    "SOURCE_INCOMPLETE", "ISSUER_COMPETENCE_EVIDENCE_MISSING");
  check({ ...s, delegationSourceId: "" },
    "SOURCE_INCOMPLETE", "DELEGATION_EVIDENCE_MISSING");
});

test("identity binding contract contains no grant outcome", () => {
  for (const s of [
    sources(),
    { ...sources(), holder: null },
    { ...sources(), sessionUserId: "another" },
  ]) {
    const r = assessInstitutionalDelegationIdentityBinding(admission, mandate(), s);
    assert.equal(r.operativeAuthorityEstablished, false);
    assert.equal(r.admissionAuthorized, false);
    assert.notEqual(r.standing, "AUTHORIZED");
  }
});
