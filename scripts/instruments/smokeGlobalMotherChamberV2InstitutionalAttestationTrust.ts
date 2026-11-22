import assert from "node:assert/strict";
import {
  resolveChamberV2InstitutionalAttestationTrust,
  type ChamberV2AttestationSnapshot,
} from "../../src/domains/instruments/global-mother/resolveChamberV2InstitutionalAttestationTrust";

const at = new Date("2026-10-28T12:00:00.000Z");
const claim = { userId: "user-1", institutionId: "institution-1", capacity: "DELEGATE" };
const mandate: ChamberV2AttestationSnapshot = {
  subjectUserId: "user-1",
  subjectIdentityEvidenceReference: "IDENTITY-1",
  representedInstitutionId: "institution-1",
  representedInstitutionEvidenceReference: "INSTITUTION-1",
  capacity: "DELEGATE",
  issuerInstitutionId: "institution-1",
  issuerInstitutionEvidenceReference: "ISSUER-1",
  issuerCompetenceEvidenceReference: "ISSUER-COMPETENCE-1",
  issuerAuthorityReference: "AUTHORITY-1",
  mandateReference: "MANDATE-1",
  mandateEvidenceReference: "EVIDENCE-1",
  mandateAuthenticityEvidenceReference: "SIGNATURE-1",
  verificationActorUserId: "verifier-1",
  verificationEvidenceReference: "CHECK-1",
  verifiedAt: new Date("2026-10-27T12:00:00.000Z"),
  effectiveAt: new Date("2026-10-27T12:00:00.000Z"),
  expiresAt: new Date("2026-11-27T12:00:00.000Z"),
  revokedAt: null,
  suspendedAt: null,
  supersededByMandateReference: null,
  scope: ["DELEGATE"],
};
const assess = (a: readonly ChamberV2AttestationSnapshot[] = [mandate], c = claim, when = at) =>
  resolveChamberV2InstitutionalAttestationTrust({ claim: c, attestations: a, at: when });
const check = (standing: string, reason: string, a: readonly ChamberV2AttestationSnapshot[] = [mandate], c = claim, when = at) => {
  const r = assess(a, c, when);
  assert.equal(r.standing, standing);
  assert.equal(r.reason, reason);
  assert.equal(r.operationallyUsable, false);
};
const change = (patch: Partial<ChamberV2AttestationSnapshot>) => [{ ...mandate, ...patch }];

check("STRUCTURALLY_SUPPORTED", "UNAUTHENTICATED_SNAPSHOT_ONLY");
check("UNVERIFIED", "NO_EXACT_MANDATE", []);
check("UNVERIFIED", "NO_EXACT_MANDATE", [mandate], { ...claim, userId: "other" });
check("UNVERIFIED", "NO_EXACT_MANDATE", [mandate], { ...claim, institutionId: "other" });
check("UNVERIFIED", "NO_EXACT_MANDATE", [mandate], { ...claim, capacity: "OTHER" });
check("CONFLICTED", "MULTIPLE_EXACT_MANDATES", [mandate, { ...mandate, mandateReference: "MANDATE-2" }]);
check("CONFLICTED", "MULTIPLE_EXACT_MANDATES", [mandate, { ...mandate, revokedAt: at }]);
check("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", change({ issuerCompetenceEvidenceReference: "" }));
check("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", change({ issuerInstitutionId: "" }));
check("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", change({ subjectIdentityEvidenceReference: "" }));
check("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", change({ mandateAuthenticityEvidenceReference: "" }));
check("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", change({ verificationEvidenceReference: "" }));
check("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", change({ scope: [] }));
check("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", change({ scope: ["DELEGATE", "DELEGATE"] }));
check("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", change({ expiresAt: new Date("2026-10-26T12:00:00Z") }));
check("UNVERIFIED", "NON_INDEPENDENT_OR_SELF_REFERENTIAL_SOURCE", change({ mandateReference: "GM-CHAMBER-1" }));
check("UNVERIFIED", "NON_INDEPENDENT_OR_SELF_REFERENTIAL_SOURCE", change({ issuerAuthorityReference: "CHAMBER_ADMISSION:1" }));
check("REVOKED", "MANDATE_NOT_CURRENT", change({ revokedAt: at }));
check("REVOKED", "MANDATE_NOT_CURRENT", change({ suspendedAt: at }));
check("REVOKED", "MANDATE_NOT_CURRENT", change({ supersededByMandateReference: "MANDATE-2" }));
check("UNVERIFIED", "VERIFICATION_OR_MANDATE_NOT_YET_EFFECTIVE", change({ verifiedAt: new Date("2026-10-29T12:00:00Z") }));
check("UNVERIFIED", "VERIFICATION_OR_MANDATE_NOT_YET_EFFECTIVE", change({ effectiveAt: new Date("2026-10-29T12:00:00Z") }));
check("UNVERIFIED", "MANDATE_EXPIRED", change({ expiresAt: at }));
check("UNVERIFIED", "CAPACITY_OUT_OF_MANDATE_SCOPE", change({ scope: ["OBSERVER"] }));
check("UNVERIFIED", "INVALID_INPUT", [mandate], { ...claim, userId: " " });
check("UNVERIFIED", "INVALID_INPUT", [mandate], claim, new Date("invalid"));
assert.equal(assess().operationallyUsable, false);
console.log("GM-V2.1B.2B.3: 26 deterministic test cases passed; no institutional authority conferred.");
