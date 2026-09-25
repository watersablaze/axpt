import { DIGITAL_SETTLEMENT_STATUS, type DigitalSettlementStatus } from "../contracts";

export const INDERAKSH_SPA_REFERENCE =
  "SPA-FWI-IGR-AU-2026-017" as const;

export const INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE =
  "CP-FWI-IGR-AU-2026-017" as const;

export const INDERAKSH_TRANSACTION_CONTINUITY = {
  transactionLabel: "Initial 50 KG Gold Doré Transaction",
  governingDocuments: [
    {
      kind: "SPA",
      title: "Sales & Purchase Agreement",
      reference: INDERAKSH_SPA_REFERENCE,
      role: "Governing agreement",
      fileName: "SPA-FWI-IGR-AU-2026-017.pdf",
      status: "FINAL REVIEW",
      publicationState: "SOURCE RECEIVED",
    },
    {
      kind: "COMMERCIAL_SCHEDULE",
      title: "Commercial Schedule",
      reference: INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE,
      role: "Commercial configuration",
      fileName: "CP-FWI-IGR-AU-2026-017.pdf",
      status: "FINAL REVIEW",
      publicationState: "SOURCE RECEIVED",
    },
    {
      kind: "DSI",
      title: "Digital Settlement Instrument",
      reference: "FW-DSI-2026-001",
      role: "Settlement continuity and recognition record",
      fileName: null,
      status: "ACTIVE",
      publicationState: "ISSUED",
    },
  ],
  transactionNotices: [
    {
      label: "Buyer signatory confirmation",
      status: "CONFIRMATION REQUIRED",
      body:
        "Corey Keller is pre-populated for transaction continuity based on his execution of the Buyer LOI and identified role as Vice President / Buyer Representative. Buyer must confirm his authority to execute the SPA and Commercial Schedule, or provide the duly authorized alternate signatory before execution.",
    },
    {
      label: "Delivery term clarification",
      status: "CIP / AIR FREIGHT",
      body:
        "The Buyer LOI used CIF as preliminary insured-delivery terminology. The definitive Commercial Schedule uses CIP Inderaksh Gold Refinery FZ-LLC, Dubai, United Arab Emirates, Incoterms® 2020 to reflect the Seller-coordinated international air-freight and insurance structure.",
    },
    {
      label: "Execution process",
      status: "EXTERNAL EXECUTION",
      body:
        "AXPT presently governs controlled issuance, access, transaction continuity, and settlement-state recording. Formal document execution remains external to AXPT for this release; executed counterparts are subsequently recorded in the transaction environment.",
    },
  ],
  lifecycle: [
    {
      id: "AGREEMENT",
      index: "01",
      label: "Agreement",
      description: "SPA and Commercial Schedule establish the governing and commercial baseline.",
    },
    {
      id: "TAP",
      index: "02",
      label: "TAP",
      description: "Verification, authorization, transfer, recognition, and application.",
    },
    {
      id: "EXPORT_PASSAGE",
      index: "03",
      label: "Export Passage",
      description: "Documented transaction and lawful export-passage performance.",
    },
    {
      id: "RECONCILIATION",
      index: "04",
      label: "Reconciliation",
      description: "TAP application is reconciled against documentary evidence.",
    },
    {
      id: "FINAL_SETTLEMENT",
      index: "05",
      label: "Final Settlement",
      description: "Final commercial obligation is routed, verified, and recognized.",
    },
    {
      id: "CLOSED",
      index: "06",
      label: "Closed",
      description: "Settlement and transaction closure are recorded in the continuing DSI environment.",
    },
  ],
} as const;

export function resolveInderakshLifecycleStage(
  settlementStatus: DigitalSettlementStatus,
) {
  switch (settlementStatus) {
    case DIGITAL_SETTLEMENT_STATUS.PENDING_ISSUANCE:
      return "AGREEMENT" as const;

    case DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER:
    case DIGITAL_SETTLEMENT_STATUS.VERIFICATION_CONFIRMED:
    case DIGITAL_SETTLEMENT_STATUS.AWAITING_TRANSFER:
    case DIGITAL_SETTLEMENT_STATUS.DETECTED:
    case DIGITAL_SETTLEMENT_STATUS.CONFIRMING:
    case DIGITAL_SETTLEMENT_STATUS.CONFIRMED:
    case DIGITAL_SETTLEMENT_STATUS.FAILED_REVIEW:
      return "TAP" as const;

    case DIGITAL_SETTLEMENT_STATUS.CANCELLED:
      return "AGREEMENT" as const;
  }
}
