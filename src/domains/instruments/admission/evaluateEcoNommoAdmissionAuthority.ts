/**
 * ECN-REG-1C.2B — PURE AUTHORIZATION DECISION, NOT AN AUTHENTICATOR.
 *
 * This module must receive authority facts constructed by trusted server
 * resolvers. Never pass untrusted request-body assertions to this evaluator.
 * A true result is NOT authorization for persistence without fresh, server-side
 * principal, mandate, custody, and uniqueness checks in the write operation.
 * No permissions, roles, DB state, sessions or institutions are created here.
 */
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

export const ECO_NOMMO_ADMISSION_PERMISSION = "INSTRUMENT_DRAFT_ADMIT" as const;
export const ECO_NOMMO_ADMISSION_ACTION = "REGISTER_DRAFT_INSTRUMENT" as const;

export type TrustedAdmissionAuthorityFacts = Readonly<{
  actorUserId: string;
  persistedSessionVerified: boolean;
  sessionEligible: boolean;
  permissionKeys: readonly string[];
  institutionalCapacity: string;
  institutionId: string;
  mandateId: string;
  mandateVerified: boolean;
  mandateActive: boolean;
  mandateInstitutionId: string;
  mandateHolderUserId: string;
  mandateAction: string;
  mandateCollectionKey: string;
  mandateLibraryReference: string;
  mandateSourceReference: string;
  mandateSourceEdition: string;
  mandateExpiresAt: string | null;
}>;

export type AdmissionAuthorityDecision =
  | Readonly<{ permitted: true; decision: "ELIGIBLE_FOR_FURTHER_QUALIFICATION" }>
  | Readonly<{ permitted: false; decision: "DENIED"; reasons: readonly string[] }>;

function meaningful(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value === value.trim();
}

/**
 * All facts are treated as *assertions* supplied by the trusted server layer.
 * This check can reject incoherent or insufficient facts; it cannot prove
 * the authenticity of an identity, permission, mandate or signature.
 */
export function evaluateEcoNommoAdmissionAuthority(
  admission: Pick<EcoNommoDraftAdmission,
    "actorUserId" | "collectionKey" | "libraryReference" |
    "sourceReference" | "sourceEdition" | "instrumentStatus" | "versionStatus">,
  facts: TrustedAdmissionAuthorityFacts | null | undefined,
  at: Date,
): AdmissionAuthorityDecision {
  const reasons: string[] = [];

  if (!(at instanceof Date) || !Number.isFinite(at.getTime())) {
    return { permitted: false, decision: "DENIED", reasons: ["INVALID_DECISION_TIME"] };
  }
  if (!facts) {
    return { permitted: false, decision: "DENIED", reasons: ["TRUSTED_AUTHORITY_FACTS_REQUIRED"] };
  }

  if (facts.persistedSessionVerified !== true) reasons.push("PERSISTED_SESSION_NOT_VERIFIED");
  if (facts.sessionEligible !== true) reasons.push("SESSION_NOT_ELIGIBLE");

  if (!meaningful(facts.actorUserId) ||
      !meaningful(admission.actorUserId) ||
      facts.actorUserId !== admission.actorUserId) {
    reasons.push("ACTOR_BINDING_MISMATCH");
  }

  if (!Array.isArray(facts.permissionKeys) ||
      !facts.permissionKeys.includes(ECO_NOMMO_ADMISSION_PERMISSION)) {
    reasons.push("ADMISSION_PERMISSION_MISSING");
  }

  if (!meaningful(facts.institutionalCapacity) ||
      !meaningful(facts.institutionId)) {
    reasons.push("INSTITUTIONAL_CAPACITY_MISSING");
  }

  if (!meaningful(facts.mandateId) ||
      facts.mandateVerified !== true ||
      facts.mandateActive !== true) {
    reasons.push("QUALIFIED_ACTIVE_MANDATE_MISSING");
  }

  if (!meaningful(facts.mandateHolderUserId) ||
      facts.mandateHolderUserId !== facts.actorUserId ||
      !meaningful(facts.mandateInstitutionId) ||
      facts.mandateInstitutionId !== facts.institutionId) {
    reasons.push("MANDATE_HOLDER_OR_INSTITUTION_MISMATCH");
  }

  if (facts.mandateAction !== ECO_NOMMO_ADMISSION_ACTION ||
      facts.mandateCollectionKey !== admission.collectionKey ||
      facts.mandateLibraryReference !== admission.libraryReference ||
      facts.mandateSourceReference !== admission.sourceReference ||
      facts.mandateSourceEdition !== admission.sourceEdition ||
      admission.instrumentStatus !== "DRAFT" ||
      admission.versionStatus !== "DRAFT") {
    reasons.push("MANDATE_SCOPE_MISMATCH");
  }

  if (facts.mandateExpiresAt !== null) {
    const expiry = typeof facts.mandateExpiresAt === "string"
      ? Date.parse(facts.mandateExpiresAt) : Number.NaN;
    if (!Number.isFinite(expiry) ||
        !/^(?:\d{4})-\d{2}-\d{2}T/.test(facts.mandateExpiresAt ?? "") ||
        expiry <= at.getTime()) {
      reasons.push("MANDATE_EXPIRED_OR_INVALID");
    }
  }

  return reasons.length
    ? { permitted: false, decision: "DENIED", reasons }
    : { permitted: true, decision: "ELIGIBLE_FOR_FURTHER_QUALIFICATION" };
}
