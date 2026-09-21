import {
  INSTRUMENT_ACCESS_LEVEL,
  INSTRUMENT_PARTY_ROLE,
  type InstrumentAccessLevel,
  type InstrumentPartyRole,
} from "../contracts";
import {
  DIGITAL_SETTLEMENT_V2_RECIPIENTS,
  DSI_V2_FINANCIER_REVISION,
  DSI_V2_VERSION,
  type DigitalSettlementV2RecipientKey,
} from "./digitalSettlementV2FinancierRevision";

export const DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE = {
  ACTIVE_RESPONSE: "ACTIVE_RESPONSE",
  REVIEW: "REVIEW",
  INTERNAL_REVIEW: "INTERNAL_REVIEW",
  FIDUCIARY_REVIEW: "FIDUCIARY_REVIEW",
} as const;

export type DigitalSettlementV2AccessPurpose =
  (typeof DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE)[keyof typeof DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE];

export const DIGITAL_SETTLEMENT_V2_AUTHORITY = {
  VERIFICATION_TRANSFER_ONLY: "VERIFICATION_TRANSFER_ONLY",
  NONE: "NONE",
} as const;

export type DigitalSettlementV2Authority =
  (typeof DIGITAL_SETTLEMENT_V2_AUTHORITY)[keyof typeof DIGITAL_SETTLEMENT_V2_AUTHORITY];

export type DigitalSettlementV2AccessPlanEntry = Readonly<{
  key: DigitalSettlementV2RecipientKey;
  instrumentVersionNumber: typeof DSI_V2_VERSION;
  recipientName: string;
  email: string;
  recipientRole: InstrumentPartyRole;
  accessLevel: InstrumentAccessLevel;
  accessPurpose: DigitalSettlementV2AccessPurpose;
  authority: DigitalSettlementV2Authority;
  authorizedAmountUsdt: string | null;
}>;

export const DIGITAL_SETTLEMENT_V2_ACCESS_PLAN = [
  {
    key: "financier",
    instrumentVersionNumber: DSI_V2_VERSION,
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.financier.name,
    email:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.financier.email,
    recipientRole:
      INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
    accessLevel: INSTRUMENT_ACCESS_LEVEL.VIEW,
    accessPurpose:
      DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE.ACTIVE_RESPONSE,
    authority:
      DIGITAL_SETTLEMENT_V2_AUTHORITY.VERIFICATION_TRANSFER_ONLY,
    authorizedAmountUsdt:
      DSI_V2_FINANCIER_REVISION.activeAction.authorizedAmountUsdt,
  },
  {
    key: "buyerRepresentative",
    instrumentVersionNumber: DSI_V2_VERSION,
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.buyerRepresentative.name,
    email:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.buyerRepresentative.email,
    recipientRole:
      INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
    accessLevel: INSTRUMENT_ACCESS_LEVEL.VIEW,
    accessPurpose:
      DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE.REVIEW,
    authority: DIGITAL_SETTLEMENT_V2_AUTHORITY.NONE,
    authorizedAmountUsdt: null,
  },
  {
    key: "externalReviewer",
    instrumentVersionNumber: DSI_V2_VERSION,
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.externalReviewer.name,
    email:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.externalReviewer.email,
    recipientRole: INSTRUMENT_PARTY_ROLE.REVIEWER,
    accessLevel: INSTRUMENT_ACCESS_LEVEL.VIEW,
    accessPurpose:
      DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE.REVIEW,
    authority: DIGITAL_SETTLEMENT_V2_AUTHORITY.NONE,
    authorizedAmountUsdt: null,
  },
  {
    key: "bobby",
    instrumentVersionNumber: DSI_V2_VERSION,
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.bobby.name,
    email:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.bobby.email,
    recipientRole: INSTRUMENT_PARTY_ROLE.REVIEWER,
    accessLevel: INSTRUMENT_ACCESS_LEVEL.VIEW,
    accessPurpose:
      DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE.INTERNAL_REVIEW,
    authority: DIGITAL_SETTLEMENT_V2_AUTHORITY.NONE,
    authorizedAmountUsdt: null,
  },
  {
    key: "lawrence",
    instrumentVersionNumber: DSI_V2_VERSION,
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.lawrence.name,
    email:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.lawrence.email,
    recipientRole: INSTRUMENT_PARTY_ROLE.REVIEWER,
    accessLevel: INSTRUMENT_ACCESS_LEVEL.VIEW,
    accessPurpose:
      DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE.FIDUCIARY_REVIEW,
    authority: DIGITAL_SETTLEMENT_V2_AUTHORITY.NONE,
    authorizedAmountUsdt: null,
  },
] as const satisfies readonly DigitalSettlementV2AccessPlanEntry[];
