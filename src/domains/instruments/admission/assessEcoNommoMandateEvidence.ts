/**
 * ECN-REG-1C.2F — documentary mandate evidence consistency only.
 *
 * This is not an authenticator. Every field is an untrusted candidate until
 * issuer competence, signatures, custody, institutional standing, delegation
 * and revocation are independently resolved by a trusted server boundary.
 * A consistent candidate MUST NOT set mandateVerified or mandateActive.
 *
 * Does not access databases, install permissions or authorize registration.
 */
import { ECO_NOMMO_ADMISSION_ACTION } from "./evaluateEcoNommoAdmissionAuthority";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

export type EcoNommoMandateEvidenceCandidate = Readonly<{
  mandateReference: string;
  issuerInstitutionId: string;
  issuerRepresentativeUserId: string;
  representedInstitutionId: string;
  holderUserId: string;
  holderCapacity: string;
  action: string;
  collectionKey: string;
  libraryReference: string;
  sourceReference: string;
  sourceEdition: string;
  effectiveAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  supersededAt: string | null;
  evidenceReference: string;
  evidenceCustodyReference: string;
  evidenceSha256: string;
  evidenceIssuerAuthenticationReference: string;
  evidenceIssuerCompetenceReference: string;
  evidenceHolderAcceptanceReference: string;
  evidenceIndependentVerifierReference: string;
}>;

type ScopedAdmission = Pick<EcoNommoDraftAdmission,
  "actorUserId" | "collectionKey" | "libraryReference" |
  "sourceReference" | "sourceEdition" | "instrumentStatus" | "versionStatus">;

export type MandateEvidenceAssessment =
  | Readonly<{
      consistent: true;
      standing: "DOCUMENTARY_CANDIDATE_ONLY";
      mandateReference: string;
      evidenceReference: string;
      operativeAuthorityEstablished: false;
    }>
  | Readonly<{
      consistent: false;
      standing: "REJECTED";
      reasons: readonly string[];
      operativeAuthorityEstablished: false;
    }>;

function nonblank(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 && value.length <= 256 &&
    value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);
}

function instant(value: unknown): number | null {
  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value
    ? date.getTime() : null;
}

/**
 * The candidate may be supplied by any party, including the requestor.
 * Do not use a positive result as trusted authorization facts. The external
 * resolution and authentication bridge is deliberately NOT implemented here.
 */
export function assessEcoNommoMandateEvidence(
  admission: ScopedAdmission,
  candidate: EcoNommoMandateEvidenceCandidate | null | undefined,
  at: Date,
): MandateEvidenceAssessment {
  const reasons: string[] = [];
  if (!(at instanceof Date) || !Number.isFinite(at.getTime())) {
    return { consistent: false, standing: "REJECTED",
      reasons: ["INVALID_ASSESSMENT_TIME"], operativeAuthorityEstablished: false };
  }
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { consistent: false, standing: "REJECTED",
      reasons: ["MANDATE_EVIDENCE_REQUIRED"], operativeAuthorityEstablished: false };
  }

  const required = [
    "mandateReference", "issuerInstitutionId", "issuerRepresentativeUserId",
    "representedInstitutionId", "holderUserId", "holderCapacity",
    "evidenceReference", "evidenceCustodyReference",
    "evidenceIssuerAuthenticationReference", "evidenceIssuerCompetenceReference",
    "evidenceHolderAcceptanceReference", "evidenceIndependentVerifierReference",
  ] as const;

  for (const key of required) {
    if (!nonblank(candidate[key])) reasons.push("MISSING_OR_INVALID:" + key);
  }

  if (!nonblank(candidate.issuerRepresentativeUserId) ||
      candidate.issuerRepresentativeUserId === candidate.holderUserId ||
      candidate.evidenceIndependentVerifierReference === candidate.issuerRepresentativeUserId ||
      candidate.evidenceIndependentVerifierReference === candidate.holderUserId) {
    reasons.push("INDEPENDENT_ROLES_REQUIRED");
  }

  if (candidate.action !== ECO_NOMMO_ADMISSION_ACTION ||
      candidate.collectionKey !== admission.collectionKey ||
      candidate.libraryReference !== admission.libraryReference ||
      candidate.sourceReference !== admission.sourceReference ||
      candidate.sourceEdition !== admission.sourceEdition ||
      candidate.holderUserId !== admission.actorUserId ||
      admission.instrumentStatus !== "DRAFT" ||
      admission.versionStatus !== "DRAFT") {
    reasons.push("EXACT_DOCUMENTARY_SCOPE_REQUIRED");
  }

  if (typeof candidate.evidenceSha256 !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(candidate.evidenceSha256)) {
    reasons.push("MANDATE_EVIDENCE_DIGEST_INVALID");
  }

  const effective = instant(candidate.effectiveAt);
  const expiry = candidate.expiresAt === null ? null : instant(candidate.expiresAt);
  const revoked = candidate.revokedAt === null ? null : instant(candidate.revokedAt);
  const superseded = candidate.supersededAt === null ? null : instant(candidate.supersededAt);

  if (effective === null ||
      effective > at.getTime() ||
      (candidate.expiresAt !== null && expiry === null) ||
      (expiry !== null && (effective === null || expiry <= effective || expiry <= at.getTime()))) {
    reasons.push("MANDATE_EFFECTIVE_WINDOW_INVALID");
  }
  // An explicit revocation or supersession is always ineligible, even if its
  // timestamp claims to be in the future: the record is not an active mandate.
  if (candidate.revokedAt !== null || candidate.supersededAt !== null ||
      (candidate.revokedAt !== null && revoked === null) ||
      (candidate.supersededAt !== null && superseded === null)) {
    reasons.push("MANDATE_REVOKED_OR_SUPERSEDED");
  }

  if (reasons.length > 0) {
    return { consistent: false, standing: "REJECTED",
      reasons, operativeAuthorityEstablished: false };
  }
  return { consistent: true, standing: "DOCUMENTARY_CANDIDATE_ONLY",
    mandateReference: candidate.mandateReference,
    evidenceReference: candidate.evidenceReference,
    operativeAuthorityEstablished: false };
}
