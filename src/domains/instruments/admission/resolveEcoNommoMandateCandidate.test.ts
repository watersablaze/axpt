import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveEcoNommoMandateCandidate,
  type EcoNommoMandateResolutionObservations,
} from "./resolveEcoNommoMandateCandidate";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

const now = new Date("2026-11-17T12:00:00.000Z");
const admission: EcoNommoDraftAdmission = {
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-001",
  sourceEdition: "Review 01",
  title: "Synthetic draft",
  kind: "GENERAL",
  instrumentStatus: "DRAFT",
  versionStatus: "DRAFT",
  custodyReference: "synthetic-document-custody",
  sourceSha256: "aa".repeat(32),
  actorUserId: "holder-1",
  correlationId: "correlation-1",
};
function candidate(): EcoNommoMandateEvidenceCandidate {
  return {
    mandateReference: "mandate-1",
    issuerInstitutionId: "issuer-institution",
    issuerRepresentativeUserId: "issuer-1",
    representedInstitutionId: "holder-institution",
    holderUserId: "holder-1",
    holderCapacity: "DOCUMENTARY_ADMISSION",
    action: "REGISTER_DRAFT_INSTRUMENT",
    collectionKey: "ECO_NOMMO",
    libraryReference: "EN-00",
    sourceReference: "SYNTHETIC-001",
    sourceEdition: "Review 01",
    effectiveAt: "2026-11-01T00:00:00.000Z",
    expiresAt: "2026-12-01T00:00:00.000Z",
    revokedAt: null,
    supersededAt: null,
    evidenceReference: "evidence-1",
    evidenceCustodyReference: "custody-1",
    evidenceSha256: "bb".repeat(32),
    evidenceIssuerAuthenticationReference: "issuer-auth-evidence",
    evidenceIssuerCompetenceReference: "issuer-competence-evidence",
    evidenceHolderAcceptanceReference: "holder-acceptance",
    evidenceIndependentVerifierReference: "verifier-ref",
  };
}
function observations(): EcoNommoMandateResolutionObservations {
  return {
    sessionUserId: "holder-1",
    holder: {
      userId: "holder-1", institutionId: "holder-institution",
      capacity: "DOCUMENTARY_ADMISSION", standing: "ACTIVE",
    },
    issuer: {
      userId: "issuer-1", institutionId: "issuer-institution",
      standing: "ACTIVE",
    },
    verifier: {
      userId: "verifier-1", institutionId: "independent-institution",
      standing: "ACTIVE",
    },
    mandateEvidence: {
      reference: "evidence-1", custodyReference: "custody-1",
      sha256: "bb".repeat(32),
      issuerAuthenticationReference: "issuer-auth-evidence",
      issuerCompetenceReference: "issuer-competence-evidence",
      holderAcceptanceReference: "holder-acceptance",
      independentVerifierUserId: "verifier-1",
    },
    mandateCurrent: {
      reference: "mandate-1", revoked: false, superseded: false,
    },
  };
}
function assertStanding(
  expected: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED",
  reason: string,
  source: EcoNommoMandateResolutionObservations | null,
  mandate: EcoNommoMandateEvidenceCandidate | null = candidate(),
) {
  const result = resolveEcoNommoMandateCandidate(admission, mandate, source, now);
  assert.equal(result.standing, expected);
  assert.equal(result.operativeAuthorityEstablished, false);
  assert.ok(result.reasons.includes(reason), result.reasons.join(", "));
}

test("fully aligned synthetic records NEVER produce authenticated authority", () => {
  const result = resolveEcoNommoMandateCandidate(admission, candidate(), observations(), now);
  assert.deepEqual(result, {
    standing: "AUTHENTICATION_REQUIRED",
    reasons: ["INDEPENDENT_MANDATE_AUTHENTICATION_NOT_ESTABLISHED"],
    operativeAuthorityEstablished: false,
  });
});

test("missing observations or candidate are non-operative", () => {
  assertStanding("SOURCE_INCOMPLETE", "RESOLVED_OBSERVATIONS_MISSING", null);
  assertStanding("SOURCE_CONFLICTED", "DOCUMENTARY_MANDATE_EVIDENCE_REQUIRED", observations(), null);
});

test("session actor mismatch is rejected", () => {
  assertStanding("SOURCE_CONFLICTED", "SESSION_ACTOR_MISMATCH", {
    ...observations(), sessionUserId: "someone-else",
  });
  assertStanding("SOURCE_INCOMPLETE", "VERIFIED_SESSION_USER_MISSING", {
    ...observations(), sessionUserId: null,
  });
});

test("holder identity, institution, capacity and standing must match", () => {
  const o = observations();
  assertStanding("SOURCE_CONFLICTED", "HOLDER_INSTITUTION_OR_CAPACITY_MISMATCH", {
    ...o, holder: { ...o.holder!, institutionId: "wrong" },
  });
  assertStanding("SOURCE_CONFLICTED", "HOLDER_INSTITUTION_OR_CAPACITY_MISMATCH", {
    ...o, holder: { ...o.holder!, capacity: "OTHER" },
  });
  assertStanding("SOURCE_CONFLICTED", "HOLDER_STANDING_NOT_ACTIVE", {
    ...o, holder: { ...o.holder!, standing: "INACTIVE" },
  });
});

test("issuer identity and standing cannot be inferred from reference alone", () => {
  const o = observations();
  assertStanding("SOURCE_INCOMPLETE", "ISSUER_STANDING_MISSING", {
    ...o, issuer: null,
  });
  assertStanding("SOURCE_CONFLICTED", "ISSUER_IDENTITY_MISMATCH", {
    ...o, issuer: { ...o.issuer!, institutionId: "wrong" },
  });
  assertStanding("SOURCE_CONFLICTED", "ISSUER_STANDING_NOT_ACTIVE", {
    ...o, issuer: { ...o.issuer!, standing: "INACTIVE" },
  });
});

test("canonical verifier identity must differ from both actors and institutions", () => {
  const o = observations();
  assertStanding("SOURCE_CONFLICTED", "VERIFIER_NOT_INDEPENDENT", {
    ...o, verifier: { ...o.verifier!, userId: "holder-1" },
  });
  assertStanding("SOURCE_CONFLICTED", "VERIFIER_NOT_INDEPENDENT", {
    ...o, verifier: { ...o.verifier!, institutionId: "issuer-institution" },
  });
  assertStanding("SOURCE_CONFLICTED", "VERIFIER_NOT_INDEPENDENT", {
    ...o, verifier: { ...o.verifier!, institutionId: "holder-institution" },
  });
  assertStanding("SOURCE_INCOMPLETE", "VERIFIER_IDENTITY_MISSING", {
    ...o, verifier: null,
  });
});

test("evidence bindings must agree with separately resolved records", () => {
  const o = observations();
  assertStanding("SOURCE_INCOMPLETE", "MANDATE_EVIDENCE_NOT_RESOLVED", {
    ...o, mandateEvidence: null,
  });
  assertStanding("SOURCE_CONFLICTED", "MANDATE_EVIDENCE_BINDING_MISMATCH", {
    ...o, mandateEvidence: { ...o.mandateEvidence!, sha256: "cc".repeat(32) },
  });
  assertStanding("SOURCE_CONFLICTED", "MANDATE_EVIDENCE_BINDING_MISMATCH", {
    ...o, mandateEvidence: { ...o.mandateEvidence!, independentVerifierUserId: "other" },
  });
});

test("mandate revocation, supersession and identity conflicts fail closed", () => {
  const o = observations();
  assertStanding("SOURCE_INCOMPLETE", "MANDATE_LIFECYCLE_NOT_RESOLVED", {
    ...o, mandateCurrent: null,
  });
  assertStanding("SOURCE_CONFLICTED", "MANDATE_LIFECYCLE_CONFLICT", {
    ...o, mandateCurrent: { reference: "mandate-1", revoked: true, superseded: false },
  });
  assertStanding("SOURCE_CONFLICTED", "MANDATE_LIFECYCLE_CONFLICT", {
    ...o, mandateCurrent: { reference: "mandate-1", revoked: false, superseded: true },
  });
  assertStanding("SOURCE_CONFLICTED", "MANDATE_LIFECYCLE_CONFLICT", {
    ...o, mandateCurrent: { reference: "different", revoked: false, superseded: false },
  });
});

test("document edition mismatch is rejected before observation reconciliation", () => {
  assertStanding("SOURCE_CONFLICTED", "DOCUMENTARY_EXACT_DOCUMENTARY_SCOPE_REQUIRED",
    observations(), { ...candidate(), sourceEdition: "Review 02" });
});
