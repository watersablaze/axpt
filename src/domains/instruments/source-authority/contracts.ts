import type {
  InstrumentEvidenceId,
  InstitutionalInstrumentId,
} from "../contracts";

/**
 * Source Authority is an institutional instrument family.
 *
 * It records source-side institutional standing and the
 * documentary basis supporting that standing.
 *
 * It MUST NOT, merely by existence or recognition, confer:
 *
 * - sovereign State authority;
 * - regulatory approval;
 * - export authorization;
 * - commodity availability;
 * - commodity allocation;
 * - title to a specific commodity;
 * - transaction authority;
 * - settlement authority.
 */

export const SOURCE_AUTHORITY_ASSERTION_CLASS = {
  INSTITUTIONAL_IDENTITY: "INSTITUTIONAL_IDENTITY",
  SOURCE_AUTHORITY: "SOURCE_AUTHORITY",
  OPERATIONAL_CAPABILITY: "OPERATIONAL_CAPABILITY",
  COMMERCIAL_RELATIONSHIP: "COMMERCIAL_RELATIONSHIP",
  SOVEREIGN_CONTEXT: "SOVEREIGN_CONTEXT",
  INSTRUMENT_BOUNDARY: "INSTRUMENT_BOUNDARY",
} as const;

export type SourceAuthorityAssertionClass =
  (typeof SOURCE_AUTHORITY_ASSERTION_CLASS)[keyof typeof SOURCE_AUTHORITY_ASSERTION_CLASS];


export const SOURCE_AUTHORITY_CAPABILITY = {
  MINERAL_PRODUCTION_AGGREGATION:
    "MINERAL_PRODUCTION_AGGREGATION",

  COMMODITY_PREPARATION_SOURCE_COORDINATION:
    "COMMODITY_PREPARATION_SOURCE_COORDINATION",

  COMMERCIAL_PREPARATION:
    "COMMERCIAL_PREPARATION",

  EXPORT_LOGISTICS_COORDINATION:
    "EXPORT_LOGISTICS_COORDINATION",

  COUNTERPARTY_ENGAGEMENT:
    "COUNTERPARTY_ENGAGEMENT",

  DOCUMENTARY_REGULATORY_SUPPORT:
    "DOCUMENTARY_REGULATORY_SUPPORT",
} as const;

export type SourceAuthorityCapabilityKey =
  (typeof SOURCE_AUTHORITY_CAPABILITY)[keyof typeof SOURCE_AUTHORITY_CAPABILITY];


export const SOURCE_AUTHORITY_RECOGNITION_OUTCOME = {
  RECOGNIZED: "RECOGNIZED",

  RECOGNIZED_WITH_LIMITATION:
    "RECOGNIZED_WITH_LIMITATION",

  NOT_RECOGNIZED:
    "NOT_RECOGNIZED",
} as const;

export type SourceAuthorityRecognitionOutcome =
  (typeof SOURCE_AUTHORITY_RECOGNITION_OUTCOME)[keyof typeof SOURCE_AUTHORITY_RECOGNITION_OUTCOME];


export type SourceAuthoritySubject = Readonly<{
  displayName: string;

  jurisdiction: string;

  institutionalCapacity: string;

  operatingBase: string | null;

  sector: string | null;

  principalCommodityActivity:
    readonly string[];
}>;


/**
 * An assertion is a proposition recorded by the
 * Source Authority Instrument.
 *
 * An assertion is not evidence.
 *
 * An assertion is not recognition.
 *
 * An assertion does not itself grant transaction
 * or sovereign authority.
 */
export type SourceAuthorityAssertion = Readonly<{
  reference: string;

  assertionClass:
    SourceAuthorityAssertionClass;

  title: string;

  statement: string;

  /**
   * Optional structured limitation describing the
   * institutional or factual scope of the assertion.
   */
  scope: string | null;

  /**
   * These literal false values deliberately prevent a
   * Source Authority assertion from being interpreted as
   * transaction or sovereign authority.
   */
  transactionAuthorityConferred: false;

  sovereignAuthorityConferred: false;
}>;


/**
 * Capability identifies a category of source-side activity
 * described by the instrument.
 *
 * Capability does not mean current commodity availability,
 * current regulatory approval, or transaction authority.
 */
export type SourceAuthorityCapability = Readonly<{
  capabilityKey:
    SourceAuthorityCapabilityKey;

  title: string;

  description: string;

  transactionAuthorityConferred: false;

  currentCommodityAvailabilityEstablished: false;
}>;


/**
 * Recognition is a deliberate operator judgment concerning
 * ONE assertion.
 *
 * Recognition is therefore assertion-scoped rather than a
 * blanket statement that an entire instrument is "verified".
 *
 * Evidence may support recognition.
 *
 * Evidence presence alone never constitutes recognition.
 */
export type SourceAuthorityRecognition = Readonly<{
  instrumentId:
    InstitutionalInstrumentId;

  assertionReference:
    string;

  outcome:
    SourceAuthorityRecognitionOutcome;

  evidenceIds:
    readonly InstrumentEvidenceId[];

  actorUserId:
    string;

  occurredAt:
    Date;

  limitation:
    string | null;

  reason:
    string | null;

  /**
   * Recognition cannot create transaction authority merely
   * because an assertion was recognized.
   */
  transactionAuthorityConferred: false;

  /**
   * Recognition cannot substitute for sovereign State
   * authority, regulatory approval, or export authorization.
   */
  sovereignAuthorityConferred: false;
}>;


/**
 * Derived presentation state only.
 *
 * This is not itself an operator judgment and must not be
 * persisted as though it were recognition evidence.
 */
export const SOURCE_AUTHORITY_PRESENTATION_STANDING = {
  UNREVIEWED: "UNREVIEWED",
  PARTIALLY_RECOGNIZED: "PARTIALLY_RECOGNIZED",
  RECOGNIZED: "RECOGNIZED",
  LIMITED: "LIMITED",
} as const;

export type SourceAuthorityPresentationStanding =
  (typeof SOURCE_AUTHORITY_PRESENTATION_STANDING)[keyof typeof SOURCE_AUTHORITY_PRESENTATION_STANDING];
