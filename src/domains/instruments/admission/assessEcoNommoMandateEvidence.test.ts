import assert from "node:assert/strict";
import { test } from "node:test";
import { assessEcoNommoMandateEvidence } from "./assessEcoNommoMandateEvidence";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

const at = new Date("2026-11-17T12:00:00.000Z");
const admission: EcoNommoDraftAdmission = {
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-MANIFEST-001",
  sourceEdition: "Review 01",
  title: "Synthetic manifest",
  kind: "GENERAL",
  instrumentStatus: "DRAFT",
  versionStatus: "DRAFT",
  custodyReference: "synthetic-document-custody",
  sourceSha256: "ab".repeat(32),
  actorUserId: "synthetic-holder",
  correlationId: "synthetic-correlation",
};

const candidate = () => ({
  mandateReference: "synthetic-mandate",
  issuerInstitutionId: "synthetic-issuer",
  issuerRepresentativeUserId: "synthetic-issuer-user",
  representedInstitutionId: "synthetic-represented-institution",
  holderUserId: "synthetic-holder",
  holderCapacity: "DOCUMENTARY_ADMISSION",
  action: "REGISTER_DRAFT_INSTRUMENT",
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-MANIFEST-001",
  sourceEdition: "Review 01",
  effectiveAt: "2026-11-01T00:00:00.000Z",
  expiresAt: "2026-12-01T00:00:00.000Z" as string | null,
  revokedAt: null as string | null,
  supersededAt: null as string | null,
  evidenceReference: "synthetic-evidence",
  evidenceCustodyReference: "synthetic-private-custody",
  evidenceSha256: "cd".repeat(32),
  evidenceIssuerAuthenticationReference: "synthetic-authn-evidence",
  evidenceIssuerCompetenceReference: "synthetic-competence-evidence",
  evidenceHolderAcceptanceReference: "synthetic-holder-acceptance",
  evidenceIndependentVerifierReference: "synthetic-independent-verifier",
});

function reject(
  input: Parameters<typeof assessEcoNommoMandateEvidence>[1],
  reason: string,
  scope = admission,
) {
  const result = assessEcoNommoMandateEvidence(scope, input, at);
  assert.equal(result.consistent, false);
  assert.equal(result.operativeAuthorityEstablished, false);
  if (!result.consistent) assert.ok(result.reasons.includes(reason), result.reasons.join(", "));
}

test("complete synthetic candidate NEVER confers operative authority", () => {
  const result = assessEcoNommoMandateEvidence(admission, candidate(), at);
  assert.deepEqual(result, {
    consistent: true, standing: "DOCUMENTARY_CANDIDATE_ONLY",
    mandateReference: "synthetic-mandate",
    evidenceReference: "synthetic-evidence",
    operativeAuthorityEstablished: false,
  });
});

test("missing candidate and malformed time fail closed", () => {
  reject(null, "MANDATE_EVIDENCE_REQUIRED");
  const result = assessEcoNommoMandateEvidence(admission, candidate(), new Date(NaN));
  assert.equal(result.consistent, false);
  if (!result.consistent) assert.ok(result.reasons.includes("INVALID_ASSESSMENT_TIME"));
});

test("issuer, competence, acceptance, custody and verifier evidence required", () => {
  for (const key of [
    "issuerInstitutionId", "evidenceIssuerAuthenticationReference",
    "evidenceIssuerCompetenceReference", "evidenceHolderAcceptanceReference",
    "evidenceCustodyReference", "evidenceIndependentVerifierReference",
  ] as const) {
    reject({ ...candidate(), [key]: "" }, "MISSING_OR_INVALID:" + key);
  }
});

test("identity roles remain distinct", () => {
  reject({ ...candidate(), issuerRepresentativeUserId: "synthetic-holder" }, "INDEPENDENT_ROLES_REQUIRED");
  reject({ ...candidate(), evidenceIndependentVerifierReference: "synthetic-holder" }, "INDEPENDENT_ROLES_REQUIRED");
});

test("holder, action and exact document edition are bound", () => {
  reject({ ...candidate(), holderUserId: "other-holder" }, "EXACT_DOCUMENTARY_SCOPE_REQUIRED");
  reject({ ...candidate(), action: "AUTHORIZE_PAYMENT" }, "EXACT_DOCUMENTARY_SCOPE_REQUIRED");
  reject({ ...candidate(), collectionKey: "OTHER" }, "EXACT_DOCUMENTARY_SCOPE_REQUIRED");
  reject({ ...candidate(), libraryReference: "EN-01" }, "EXACT_DOCUMENTARY_SCOPE_REQUIRED");
  reject({ ...candidate(), sourceReference: "OTHER" }, "EXACT_DOCUMENTARY_SCOPE_REQUIRED");
  reject({ ...candidate(), sourceEdition: "Review 02" }, "EXACT_DOCUMENTARY_SCOPE_REQUIRED");
});

test("issued document is never admissible under a draft mandate", () => {
  const invalid = { ...admission, instrumentStatus: "ISSUED" } as unknown as EcoNommoDraftAdmission;
  reject(candidate(), "EXACT_DOCUMENTARY_SCOPE_REQUIRED", invalid);
});

test("mandate evidence digest must be 64 hex characters", () => {
  reject({ ...candidate(), evidenceSha256: "not-a-digest" }, "MANDATE_EVIDENCE_DIGEST_INVALID");
});

test("not-yet-effective, expired, inverted and invalid dates fail", () => {
  reject({ ...candidate(), effectiveAt: "2026-12-01T00:00:00.000Z" }, "MANDATE_EFFECTIVE_WINDOW_INVALID");
  reject({ ...candidate(), expiresAt: "2026-11-17T12:00:00.000Z" }, "MANDATE_EFFECTIVE_WINDOW_INVALID");
  reject({ ...candidate(), expiresAt: "2026-10-01T00:00:00.000Z" }, "MANDATE_EFFECTIVE_WINDOW_INVALID");
  reject({ ...candidate(), effectiveAt: "2026-11-31T00:00:00.000Z" }, "MANDATE_EFFECTIVE_WINDOW_INVALID");
});

test("revocation or supersession prevents positive assessment", () => {
  reject({ ...candidate(), revokedAt: "2026-11-05T00:00:00.000Z" }, "MANDATE_REVOKED_OR_SUPERSEDED");
  reject({ ...candidate(), supersededAt: "2026-11-05T00:00:00.000Z" }, "MANDATE_REVOKED_OR_SUPERSEDED");
});

test("indefinite expiry does not imply verified authority", () => {
  const result = assessEcoNommoMandateEvidence(admission, { ...candidate(), expiresAt: null }, at);
  assert.equal(result.consistent, true);
  assert.equal(result.operativeAuthorityEstablished, false);
});
