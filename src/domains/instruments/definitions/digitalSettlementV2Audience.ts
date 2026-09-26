import {
  DIGITAL_SETTLEMENT_V2_RECIPIENTS,
  type DigitalSettlementV2RecipientKey,
} from "./digitalSettlementV2FinancierRevision";

export const DIGITAL_SETTLEMENT_V2_AUDIENCE = {
  buyerRepresentative: {
    key: "buyerRepresentative",
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.buyerRepresentative.name,
    label: "COUNTERPARTY REVIEW",
    surface: "Buyer Representative",
    allowedViews: [
      "overview",
      "documents",
      "settlement",
      "evidence",
      "history",
    ],
    canViewDocuments: true,
    canViewSettlement: true,
    canViewEvidence: true,
    currentActionLabel: "REVIEW DOCUMENTS",
    currentActionTitle:
      "Review the SPA and Commercial Schedule and confirm the Buyer signatory.",
    currentActionBody:
      "These are review copies only and are not released for execution. Corey Keller is named as Buyer representative; confirm his execution authority or provide an authorized alternate before French-Ward releases execution copies.",
  },
  financier: {
    key: "financier",
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.financier.name,
    label: "FINANCIER ACCESS",
    surface: "TAP Financier",
    allowedViews: [
      "overview",
      "settlement",
      "evidence",
      "history",
    ],
    canViewDocuments: false,
    canViewSettlement: true,
    canViewEvidence: true,
    currentActionLabel: "REVIEW SETTLEMENT",
    currentActionTitle:
      "Review the current settlement instruction and verification-transfer authority.",
    currentActionBody:
      "The present authority is limited to the 50 USDT verification transfer. The remaining TAP balance is not authorized unless French-Ward separately records that authority.",
  },
  externalReviewer: {
    key: "externalReviewer",
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.externalReviewer.name,
    label: "EXTERNAL REVIEW",
    surface: "External Review Participant",
    allowedViews: [
      "overview",
      "history",
    ],
    canViewDocuments: false,
    canViewSettlement: false,
    canViewEvidence: false,
    currentActionLabel: "REVIEW STATUS",
    currentActionTitle:
      "Review the current transaction position and recorded milestones.",
    currentActionBody:
      "This access is informational and read-only. Governing documents, settlement coordinates, and operator controls are not exposed through the external-review surface.",
  },
  bobby: {
    key: "bobby",
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.bobby.name,
    label: "INTERNAL OPERATIONS",
    surface: "French-Ward Internal Operations",
    allowedViews: [
      "overview",
      "documents",
      "settlement",
      "evidence",
      "history",
    ],
    canViewDocuments: true,
    canViewSettlement: true,
    canViewEvidence: true,
    currentActionLabel: "MONITOR TRANSACTION",
    currentActionTitle:
      "Monitor counterparty review, document status, and the active settlement stage.",
    currentActionBody:
      "Full internal visibility is provided for operational continuity. Visibility does not itself grant settlement recognition, TAP authorization, document publication, or other operator mutation authority.",
  },
  lawrence: {
    key: "lawrence",
    recipientName:
      DIGITAL_SETTLEMENT_V2_RECIPIENTS.lawrence.name,
    label: "FIDUCIARY REVIEW",
    surface: "French-Ward Fiduciary Review",
    allowedViews: [
      "overview",
      "documents",
      "settlement",
      "evidence",
      "history",
    ],
    canViewDocuments: true,
    canViewSettlement: true,
    canViewEvidence: true,
    currentActionLabel: "FIDUCIARY REVIEW",
    currentActionTitle:
      "Review the governing documents, transaction state, and settlement record.",
    currentActionBody:
      "Full transaction visibility is provided for fiduciary review. Access remains read-only and does not confer operational settlement or document-control authority.",
  },
} as const;

export type DigitalSettlementV2AudienceKey =
  keyof typeof DIGITAL_SETTLEMENT_V2_AUDIENCE;

export type DigitalSettlementV2Audience =
  (typeof DIGITAL_SETTLEMENT_V2_AUDIENCE)[DigitalSettlementV2AudienceKey];

export function resolveDigitalSettlementV2Audience(
  recipientName: string | null,
): DigitalSettlementV2Audience | null {
  if (!recipientName) {
    return null;
  }

  const audiences = Object.values(
    DIGITAL_SETTLEMENT_V2_AUDIENCE,
  ) as readonly DigitalSettlementV2Audience[];

  return (
    audiences.find(
      (audience) =>
        audience.recipientName === recipientName,
    ) ?? null
  );
}

export function audienceForRecipientKey(
  key: DigitalSettlementV2RecipientKey,
): DigitalSettlementV2Audience {
  return DIGITAL_SETTLEMENT_V2_AUDIENCE[key];
}
