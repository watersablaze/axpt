export const INSTITUTIONAL_INSTRUMENT_KIND = {
  ROYAL_CUSTODIAL_FRAMEWORK: "ROYAL_CUSTODIAL_FRAMEWORK",
  REPRESENTATIVE_MANDATE: "REPRESENTATIVE_MANDATE",
  REPRESENTATIVE_APPOINTMENT: "REPRESENTATIVE_APPOINTMENT",
  LETTER_OF_INTENT: "LETTER_OF_INTENT",
  COOPERATION_FRAMEWORK: "COOPERATION_FRAMEWORK",
  DIGITAL_SETTLEMENT_INSTRUCTION: "DIGITAL_SETTLEMENT_INSTRUCTION",
  GENERAL: "GENERAL",
} as const;

export const DIGITAL_SETTLEMENT_ASSET = {
  USDT: "USDT",
} as const;

export type DigitalSettlementAsset =
  (typeof DIGITAL_SETTLEMENT_ASSET)[keyof typeof DIGITAL_SETTLEMENT_ASSET];

export const DIGITAL_SETTLEMENT_NETWORK = {
  ETHEREUM_ERC20: "ETHEREUM_ERC20",
} as const;

export type DigitalSettlementNetwork =
  (typeof DIGITAL_SETTLEMENT_NETWORK)[keyof typeof DIGITAL_SETTLEMENT_NETWORK];

export const DIGITAL_SETTLEMENT_PRICING_STATUS = {
  PENDING_FIXING: "PENDING_FIXING",
  FIXED: "FIXED",
} as const;

export type DigitalSettlementPricingStatus =
  (typeof DIGITAL_SETTLEMENT_PRICING_STATUS)[keyof typeof DIGITAL_SETTLEMENT_PRICING_STATUS];

export const DIGITAL_SETTLEMENT_STATUS = {
  PENDING_ISSUANCE: "PENDING_ISSUANCE",
  AWAITING_VERIFICATION_TRANSFER: "AWAITING_VERIFICATION_TRANSFER",
  VERIFICATION_CONFIRMED: "VERIFICATION_CONFIRMED",
  AWAITING_TRANSFER: "AWAITING_TRANSFER",
  DETECTED: "DETECTED",
  CONFIRMING: "CONFIRMING",
  CONFIRMED: "CONFIRMED",
  FAILED_REVIEW: "FAILED_REVIEW",
  CANCELLED: "CANCELLED",
} as const;

export type DigitalSettlementStatus =
  (typeof DIGITAL_SETTLEMENT_STATUS)[keyof typeof DIGITAL_SETTLEMENT_STATUS];

export type InstitutionalInstrumentKind =
  (typeof INSTITUTIONAL_INSTRUMENT_KIND)[keyof typeof INSTITUTIONAL_INSTRUMENT_KIND];

export const INSTITUTIONAL_INSTRUMENT_STATUS = {
  DRAFT: "DRAFT",
  INTERNAL_REVIEW: "INTERNAL_REVIEW",
  ISSUED: "ISSUED",
  ACCESSED: "ACCESSED",
  UNDER_DELIBERATION: "UNDER_DELIBERATION",
  CLARIFICATION_OPEN: "CLARIFICATION_OPEN",
  REVISION_PENDING: "REVISION_PENDING",
  PRINCIPLES_ALIGNED: "PRINCIPLES_ALIGNED",
  DEFINITIVE_INSTRUMENT_PENDING: "DEFINITIVE_INSTRUMENT_PENDING",
  EXECUTION_PENDING: "EXECUTION_PENDING",
  EXECUTED: "EXECUTED",
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export type InstitutionalInstrumentStatus =
  (typeof INSTITUTIONAL_INSTRUMENT_STATUS)[keyof typeof INSTITUTIONAL_INSTRUMENT_STATUS];

export const INSTRUMENT_VERSION_STATUS = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  SUPERSEDED: "SUPERSEDED",
  ARCHIVED: "ARCHIVED",
} as const;

export type InstrumentVersionStatus =
  (typeof INSTRUMENT_VERSION_STATUS)[keyof typeof INSTRUMENT_VERSION_STATUS];

export const INSTRUMENT_PROPOSITION_STATE = {
  CONFIRMED: "CONFIRMED",
  UNDERSTOOD: "UNDERSTOOD",
  PROPOSED: "PROPOSED",
  OPEN: "OPEN",
  REVISED: "REVISED",
  DECLINED: "DECLINED",
  SUPERSEDED: "SUPERSEDED",
} as const;

export type InstrumentPropositionState =
  (typeof INSTRUMENT_PROPOSITION_STATE)[keyof typeof INSTRUMENT_PROPOSITION_STATE];

export const INSTRUMENT_RESPONSE_TYPE = {
  ACKNOWLEDGE: "ACKNOWLEDGE",
  AFFIRM: "AFFIRM",
  CLARIFY: "CLARIFY",
  REVISE: "REVISE",
  DECLINE: "DECLINE",
} as const;

export type InstrumentResponseType =
  (typeof INSTRUMENT_RESPONSE_TYPE)[keyof typeof INSTRUMENT_RESPONSE_TYPE];

export const INSTRUMENT_PARTY_ROLE = {
  PRINCIPAL: "PRINCIPAL",
  CUSTODIAN: "CUSTODIAN",
  DELIBERATOR: "DELIBERATOR",
  REVIEWER: "REVIEWER",
  OBSERVER: "OBSERVER",
  COMMERCIAL_PARTICIPANT: "COMMERCIAL_PARTICIPANT",
} as const;

export type InstrumentPartyRole =
  (typeof INSTRUMENT_PARTY_ROLE)[keyof typeof INSTRUMENT_PARTY_ROLE];

export const INSTRUMENT_ACCESS_LEVEL = {
  VIEW: "VIEW",
  RESPOND: "RESPOND",
  DELIBERATE: "DELIBERATE",
  ADMINISTER: "ADMINISTER",
} as const;

export type InstrumentAccessLevel =
  (typeof INSTRUMENT_ACCESS_LEVEL)[keyof typeof INSTRUMENT_ACCESS_LEVEL];

export type InstitutionalInstrumentId = string;
export type InstrumentVersionId = string;
export type InstrumentPropositionId = string;
export type InstrumentResponseId = string;
export type InstrumentAccessGrantId = string;
export type InstrumentPartyId = string;

export type InstitutionalInstrumentIdentity = Readonly<{
  id: InstitutionalInstrumentId;
  reference: string;
  kind: InstitutionalInstrumentKind;
}>;

export type InstrumentVersionIdentity = Readonly<{
  id: InstrumentVersionId;
  instrumentId: InstitutionalInstrumentId;
  number: number;
}>;

export type InstrumentProposition = Readonly<{
  id: InstrumentPropositionId;
  versionId: InstrumentVersionId;
  reference: string;
  domain: string;
  title: string;
  body: string;
  state: InstrumentPropositionState;
  ordinal: number;
}>;

export type InstrumentResponse = Readonly<{
  id: InstrumentResponseId;
  propositionId: InstrumentPropositionId;
  actorUserId: string;
  responseType: InstrumentResponseType;
  note: string | null;
  supersedesResponseId: InstrumentResponseId | null;
  supersededAt: Date | null;
  createdAt: Date;
}>;

export type InstrumentAccessGrant = Readonly<{
  id: InstrumentAccessGrantId;
  instrumentId: InstitutionalInstrumentId;
  recipientUserId: string | null;
  recipientName: string | null;
  recipientRole: InstrumentPartyRole;
  accessLevel: InstrumentAccessLevel;
  issuedByUserId: string;
  issuedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
}>;

export const INSTRUMENT_ACCESS_TOKEN_BYTES = 32 as const;

export type InstrumentCommandContext = Readonly<{
  actorUserId: string;
  accessGrantId?: InstrumentAccessGrantId;
  correlationId: string;
  causationId?: string;
  occurredAt?: Date;
}>;

export function canRespondAtAccessLevel(
  accessLevel: InstrumentAccessLevel,
): boolean {
  return (
    accessLevel === INSTRUMENT_ACCESS_LEVEL.RESPOND ||
    accessLevel === INSTRUMENT_ACCESS_LEVEL.DELIBERATE ||
    accessLevel === INSTRUMENT_ACCESS_LEVEL.ADMINISTER
  );
}

export const INSTRUMENT_AUTHORITY_CLASS = {
  RESERVED: "RESERVED",
  JOINT: "JOINT",
  DELEGATED: "DELEGATED",
  PROHIBITED: "PROHIBITED",
} as const;

export type InstrumentAuthorityClass =
  (typeof INSTRUMENT_AUTHORITY_CLASS)[keyof typeof INSTRUMENT_AUTHORITY_CLASS];

export const INSTRUMENT_EVIDENCE_TYPE = {
  DOCUMENT: "DOCUMENT",
  ATTESTATION: "ATTESTATION",
  EXTERNAL_RECORD: "EXTERNAL_RECORD",
  DIGITAL_PROOF: "DIGITAL_PROOF",
  COMMERCIAL_RECORD: "COMMERCIAL_RECORD",
  SETTLEMENT_PROOF: "SETTLEMENT_PROOF",
  OTHER: "OTHER",
} as const;

export type InstrumentEvidenceType =
  (typeof INSTRUMENT_EVIDENCE_TYPE)[keyof typeof INSTRUMENT_EVIDENCE_TYPE];

export const INSTRUMENT_EVIDENCE_SUBJECT = {
  INSTRUMENT: "INSTRUMENT",
  VERSION: "VERSION",
  PROPOSITION: "PROPOSITION",
  AUTHORITY: "AUTHORITY",
  TRANSITION: "TRANSITION",
  RELATION: "RELATION",
  EXECUTION: "EXECUTION",
} as const;

export type InstrumentEvidenceSubject =
  (typeof INSTRUMENT_EVIDENCE_SUBJECT)[keyof typeof INSTRUMENT_EVIDENCE_SUBJECT];

export const INSTRUMENT_RELATION_TYPE = {
  GOVERNS: "GOVERNS",
  IMPLEMENTS: "IMPLEMENTS",
  DERIVES_FROM: "DERIVES_FROM",
  SUPERSEDES: "SUPERSEDES",
  SUPPORTS: "SUPPORTS",
  SETTLES: "SETTLES",
  REFERENCES: "REFERENCES",
} as const;

export type InstrumentRelationType =
  (typeof INSTRUMENT_RELATION_TYPE)[keyof typeof INSTRUMENT_RELATION_TYPE];

export type InstrumentAuthorityId = string;
export type InstrumentStateTransitionId = string;
export type InstrumentEvidenceId = string;
export type InstrumentRelationId = string;

export type InstrumentAuthority = Readonly<{
  id: InstrumentAuthorityId;
  instrumentId: InstitutionalInstrumentId;
  authorityKey: string;
  title: string;
  authorityClass: InstrumentAuthorityClass;
  holderPartyId: InstrumentPartyId | null;
  action: string;
  conditions: unknown | null;
  effectiveAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdByUserId: string;
}>;

export type InstrumentStateTransition = Readonly<{
  id: InstrumentStateTransitionId;
  instrumentId: InstitutionalInstrumentId;
  fromStatus: InstitutionalInstrumentStatus | null;
  toStatus: InstitutionalInstrumentStatus;
  actorUserId: string;
  authorityId: InstrumentAuthorityId | null;
  reason: string | null;
  metadata: unknown | null;
  occurredAt: Date;
}>;

export type InstrumentEvidence = Readonly<{
  id: InstrumentEvidenceId;
  instrumentId: InstitutionalInstrumentId;
  evidenceType: InstrumentEvidenceType;
  subjectType: InstrumentEvidenceSubject;
  subjectId: string | null;
  title: string;
  uri: string | null;
  contentHash: string | null;
  metadata: unknown | null;
  recordedByUserId: string;
  recordedAt: Date;
}>;

export type InstrumentRelation = Readonly<{
  id: InstrumentRelationId;
  sourceInstrumentId: InstitutionalInstrumentId;
  targetInstrumentId: InstitutionalInstrumentId;
  relationType: InstrumentRelationType;
  label: string | null;
  metadata: unknown | null;
  createdByUserId: string;
  createdAt: Date;
}>;

export function isInstrumentAuthorityActive(
  authority: Pick<
    InstrumentAuthority,
    "effectiveAt" | "expiresAt" | "revokedAt"
  >,
  at: Date = new Date(),
): boolean {
  return (
    authority.revokedAt === null &&
    authority.effectiveAt.getTime() <= at.getTime() &&
    (authority.expiresAt === null ||
      authority.expiresAt.getTime() > at.getTime())
  );
}
