import type {
  RepresentativeAuthorityExercisabilityReason,
  RepresentativeAuthorityKey,
} from "../contracts";

/**
 * ARP authority applicability.
 *
 * EXERCISABLE ≠ APPLICABLE
 *
 * Exercisability answers whether the representative may presently
 * exercise an authority at all.
 *
 * Applicability answers whether that otherwise relevant authority
 * reaches the specific commercial context presented for evaluation.
 */

/**
 * Context intentionally uses external references rather than
 * pretending AXPT already has canonical domain entities for every
 * scope dimension.
 *
 * Each reference remains opaque until its owning domain establishes
 * a canonical identifier.
 */
export type RepresentativeAuthorityApplicabilityContext = Readonly<{
  transactionReference?: string;
  counterpartyReference?: string;
  territory?: string;
  documentClass?: string;

  /**
   * Deliberately opaque in V1.
   *
   * ARP does not yet define canonical legal monetary-limit semantics.
   * Do not compare this value to authority conditions until that
   * doctrine is explicitly established.
   */
  monetaryContext?: Readonly<{
    amount: string;
    currency: string;
  }>;

  /**
   * Evidence that an external approval has occurred is not yet
   * modeled here. V1 only reports when authority conditions declare
   * that prior approval is required.
   */
  approvalReference?: string;
}>;

export const REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON = {
  APPLICABLE: "APPLICABLE",

  AUTHORITY_NOT_EXERCISABLE: "AUTHORITY_NOT_EXERCISABLE",

  TRANSACTION_REFERENCE_REQUIRED: "TRANSACTION_REFERENCE_REQUIRED",
  TRANSACTION_OUT_OF_SCOPE: "TRANSACTION_OUT_OF_SCOPE",

  COUNTERPARTY_REFERENCE_REQUIRED: "COUNTERPARTY_REFERENCE_REQUIRED",
  COUNTERPARTY_OUT_OF_SCOPE: "COUNTERPARTY_OUT_OF_SCOPE",

  TERRITORY_REQUIRED: "TERRITORY_REQUIRED",
  TERRITORY_OUT_OF_SCOPE: "TERRITORY_OUT_OF_SCOPE",

  DOCUMENT_CLASS_REQUIRED: "DOCUMENT_CLASS_REQUIRED",
  DOCUMENT_CLASS_OUT_OF_SCOPE: "DOCUMENT_CLASS_OUT_OF_SCOPE",

  PRIOR_APPROVAL_REQUIRED: "PRIOR_APPROVAL_REQUIRED",

  MONETARY_LIMIT_REQUIRES_EVALUATION: "MONETARY_LIMIT_REQUIRES_EVALUATION",
} as const;

export type RepresentativeAuthorityApplicabilityReason =
  (typeof REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON)[keyof typeof REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON];

export type RepresentativeAuthorityApplicabilityResult = Readonly<{
  applicable: boolean;
  reason: RepresentativeAuthorityApplicabilityReason;

  authorityKey: RepresentativeAuthorityKey;

  /**
   * Preserve the upstream exercisability outcome rather than
   * collapsing both decisions into one status.
   */
  exercisable: boolean;
  exercisabilityReason: RepresentativeAuthorityExercisabilityReason;

  evaluatedAt: Date;

  transactionReference?: string;
  counterpartyReference?: string;
  territory?: string;
  documentClass?: string;

  approvalRequired?: boolean;
  approvalAuthority?: string;

  monetaryEvaluationDeferred?: boolean;
}>;

/**
 * Applicability does not imply execution authority, document issuance,
 * transaction approval, commercial acceptance, or binding authority.
 */
export type RepresentativeAuthorityApplicabilityRequest = Readonly<{
  appointmentId: string;
  authorityKey: RepresentativeAuthorityKey;
  context: RepresentativeAuthorityApplicabilityContext;
  at?: Date;
}>;
