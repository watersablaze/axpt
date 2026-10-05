import type {
  SourceAuthorityAssertionClass,
  SourceAuthorityCapabilityKey,
  SourceAuthorityPresentationStanding,
  SourceAuthorityRecognitionOutcome,
  SourceAuthoritySubject,
} from "../contracts";

/**
 * Presentation audience is not authority.
 *
 * The audience controls which governed facts may be projected
 * into a particular surface. It does not alter the underlying
 * Source Authority Instrument or create any new authority.
 */
export type SourceAuthorityPresentationAudience =
  | "OPERATOR"
  | "RECIPIENT"
  | "REPRESENTATIVE";

export const SOURCE_AUTHORITY_PRESENTATION_AUDIENCES =
  [
    "OPERATOR",
    "RECIPIENT",
    "REPRESENTATIVE",
  ] as const satisfies readonly SourceAuthorityPresentationAudience[];

/**
 * All Source Authority projections carry the same constitutional
 * authority boundary.
 *
 * These values are deliberately literal false values. A presentation
 * layer is never permitted to turn recognition, evidence, capability,
 * or standing into one of these authorities.
 */
export type SourceAuthorityPresentationBoundary =
  Readonly<{
    sovereignAuthorityEstablished: false;
    regulatoryApprovalEstablished: false;
    exportAuthorizationEstablished: false;
    commodityAvailabilityEstablished: false;
    commodityAllocationEstablished: false;
    titleEstablished: false;
    transactionAuthorityConferred: false;
    settlementAuthorityConferred: false;
    statement: string;
  }>;

export type SourceAuthorityPresentationProfileParticulars =
  Readonly<{
    documentReference: string;
    documentVersion: string;
    documentStatus: string;

    registrationReference: string | null;
    registrationStanding: string;

    registeredAddress: string | null;

    authorizedRepresentativeName:
      string | null;

    authorizedRepresentativeCapacity:
      string | null;

    officialContact: string | null;
  }>;

export type SourceAuthorityPresentationIdentity =
  Readonly<{
    sourceAuthorityId: string;
    instrumentId: string;
    instrumentReference: string;
    instrumentTitle: string;
    versionId: string;
    versionNumber: number;
    subject: SourceAuthoritySubject;

    profileParticulars:
      SourceAuthorityPresentationProfileParticulars;
  }>;

/**
 * Evidence is projected as evidence only.
 *
 * No recognition outcome exists on this object. This prevents
 * documentary presence from being represented as institutional
 * recognition by the presentation layer.
 */
export type SourceAuthorityPresentationEvidence =
  Readonly<{
    evidenceId: string;
    evidenceRole: string;
    label: string;
    reference: string | null;
    admittedAt: string | null;
    visibleTo:
      readonly SourceAuthorityPresentationAudience[];
  }>;

/**
 * Recognition remains assertion-scoped.
 *
 * Recognition is never an instrument-wide "verified" or "approved"
 * state. Affirmative recognition preserves the evidence identifiers
 * relied upon by the operator.
 */
export type SourceAuthorityPresentationRecognition =
  Readonly<{
    recognitionId: string;
    assertionReference: string;
    outcome: SourceAuthorityRecognitionOutcome;
    evidenceIds: readonly string[];
    actorUserId: string | null;
    actorDisplayName: string | null;
    occurredAt: string;
    limitation: string | null;
    reason: string | null;
    supersedesRecognitionId: string | null;

    transactionAuthorityConferred: false;
    sovereignAuthorityConferred: false;
  }>;

/**
 * Capability identifies what source-side activity the subject is
 * represented as capable of performing.
 *
 * It does not establish inventory, availability, allocation,
 * title, assay readiness, export readiness, or transaction authority.
 */
export type SourceAuthorityPresentationCapability =
  Readonly<{
    capabilityKey: SourceAuthorityCapabilityKey;
    title: string;
    description: string;
    assertionReference: string;

    currentCommodityAvailabilityEstablished: false;
    transactionAuthorityConferred: false;

    visibleTo:
      readonly SourceAuthorityPresentationAudience[];
  }>;

/**
 * An assertion remains distinct from both documentary evidence
 * and operator recognition.
 */
export type SourceAuthorityPresentationAssertion =
  Readonly<{
    reference: string;
    assertionClass: SourceAuthorityAssertionClass;
    title: string;
    statement: string;
    scope: string | null;

    transactionAuthorityConferred: false;
    sovereignAuthorityConferred: false;

    visibleTo:
      readonly SourceAuthorityPresentationAudience[];

    recognition:
      SourceAuthorityPresentationRecognition | null;

    evidence:
      readonly SourceAuthorityPresentationEvidence[];

    capabilities:
      readonly SourceAuthorityPresentationCapability[];
  }>;

/**
 * Operator history is deliberately separate from the public-facing
 * assertion object so that recipient and representative projections
 * do not accidentally inherit internal governance history.
 */
export type SourceAuthorityPresentationOperatorRecord =
  Readonly<{
    recognitionId: string;
    assertionReference: string;
    outcome: SourceAuthorityRecognitionOutcome;
    actorUserId: string;
    occurredAt: string;
    limitation: string | null;
    reason: string | null;
    evidenceIds: readonly string[];
    supersedesRecognitionId: string | null;
    supersededByRecognitionId: string | null;
  }>;

/**
 * This is the complete governed read model consumed by presentation
 * surfaces.
 *
 * Presentation standing is derived from assertion-scoped recognition.
 * It is a summary for presentation only and is not evidence,
 * recognition, or authority.
 */
export type SourceAuthorityPresentationProjection =
  Readonly<{
    audience: SourceAuthorityPresentationAudience;

    identity: SourceAuthorityPresentationIdentity;

    standing: SourceAuthorityPresentationStanding;

    assertions:
      readonly SourceAuthorityPresentationAssertion[];

    evidenceRegister:
      readonly SourceAuthorityPresentationEvidence[];

    capabilities:
      readonly SourceAuthorityPresentationCapability[];

    operatorRecord:
      readonly SourceAuthorityPresentationOperatorRecord[];

    boundary: SourceAuthorityPresentationBoundary;
  }>;
