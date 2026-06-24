export const DOSSIER_INSTRUMENT_TYPES = [
  "SPA",
  "ANNEX_A_DELIVERY",
  "ANNEX_B_SETTLEMENT",
  "ANNEX_C_REFINERY",
  "ANNEX_D_COMPLIANCE",
  "ANNEX_E_PROCEDURE",
  "ANNEX_F_FINANCIAL_INSTRUMENT",
  "ANNEX_G_COMPENSATION_SCHEDULE",
  "EXPORT_RELEASE_NOTICE",
  "EXPORT_ACTIVATION_NOTICE",
  "ESCROW_SETUP_INSTRUCTION",
  "PAYMENT_INSTRUCTION_SHEET",
  "PAYMENT_CONFIRMATION",
  "CRYPTO_SETTLEMENT_INSTRUCTION",
  "WALLET_CONFIRMATION_SHEET",
  "CRYPTO_RECEIPT_EVIDENCE",
  "FINANCIAL_INSTRUMENT_REVIEW_SHEET",
  "FINANCIAL_INSTRUMENT_EVIDENCE",
  "REFINERY_COORDINATION_SHEET",
] as const;

export type DossierInstrumentType = (typeof DOSSIER_INSTRUMENT_TYPES)[number];

export type RequiredDossierDocument = {
  key: string;
  label: string;
  description: string;
  instrumentType?: DossierInstrumentType;
  canDraftInstrument?: boolean;
  requiredFor: string;
};

export type DossierDocumentGroup = {
  title: string;
  description: string;
  documents: RequiredDossierDocument[];
};

export const DOSSIER_DOCUMENT_GROUPS: DossierDocumentGroup[] = [
  {
    title: "Buyer / Representative",
    description:
      "Identity, authority, and funds evidence required before serious execution.",
    documents: [
      {
        key: "BUYER_CIS",
        label: "Buyer CIS",
        description:
          "Corporate information sheet or buyer profile identifying the purchasing entity.",
        requiredFor: "KYC Review",
      },
      {
        key: "BUYER_POF",
        label: "Proof of Funds",
        description:
          "Bank comfort, statement, attestation, or acceptable funds evidence.",
        requiredFor: "Commercial Qualification",
      },
      {
        key: "BUYER_AUTHORIZATION",
        label: "Authorization / Mandate",
        description:
          "Written authorization confirming the submitter or representative may act for the buyer.",
        requiredFor: "KYC Review",
      },
      {
        key: "BUYER_ID",
        label: "Passport / ID",
        description:
          "Identity document for authorized representative or beneficial control contact.",
        requiredFor: "KYC Review",
      },
      {
        key: "BUYER_BANKING",
        label: "Buyer Banking Coordinates",
        description:
          "Settlement bank details or confirmation of expected settlement path.",
        instrumentType: "ANNEX_B_SETTLEMENT",
        requiredFor: "Settlement Readiness",
      },
    ],
  },
  {
    title: "Seller / Source",
    description:
      "Seller-side documents needed to establish identity, authority, banking, and product context.",
    documents: [
      {
        key: "SELLER_KYC",
        label: "Seller KYC / Passport",
        description:
          "Seller identity package, passport, corporate profile, or cooperative authority evidence.",
        instrumentType: "ANNEX_D_COMPLIANCE",
        requiredFor: "Compliance Review",
      },
      {
        key: "SELLER_BANKING",
        label: "Seller Banking Coordinates",
        description: "Seller-side settlement or receiving bank details.",
        instrumentType: "ANNEX_B_SETTLEMENT",
        requiredFor: "Settlement Readiness",
      },
      {
        key: "PRODUCT_EVIDENCE",
        label: "Product / Origin Evidence",
        description:
          "Available origin notes, assay context, cooperative statement, or product evidence.",
        requiredFor: "Commercial Readiness",
      },
    ],
  },
  {
    title: "Transaction Package",
    description:
      "Core transaction instruments used to move from qualified opportunity to executable dossier.",
    documents: [
      {
        key: "SPA",
        canDraftInstrument: true,
        label: "SPA",
        description: "Sale and purchase agreement package for the transaction.",
        instrumentType: "SPA",
        requiredFor: "SPA Drafting",
      },
      {
        key: "ANNEX_A_DELIVERY",
        canDraftInstrument: true,
        label: "Annex A · Delivery",
        description:
          "Delivery terms, transaction route, and movement responsibilities.",
        instrumentType: "ANNEX_A_DELIVERY",
        requiredFor: "SPA Package",
      },
      {
        key: "ANNEX_B_SETTLEMENT",
        canDraftInstrument: true,
        label: "Annex B · Settlement",
        description: "Banking, payment, escrow, or settlement pathway terms.",
        instrumentType: "ANNEX_B_SETTLEMENT",
        requiredFor: "Settlement Readiness",
      },
      {
        key: "ANNEX_C_REFINERY",
        canDraftInstrument: true,
        label: "Annex C · Refinery",
        description:
          "Refinery coordination, assay, intake, and processing expectations.",
        instrumentType: "ANNEX_C_REFINERY",
        requiredFor: "Refinery Coordination",
      },
      {
        key: "ANNEX_D_COMPLIANCE",
        canDraftInstrument: true,
        label: "Annex D · Compliance",
        description:
          "KYC, identity, authorization, and commercial compliance package.",
        instrumentType: "ANNEX_D_COMPLIANCE",
        requiredFor: "Compliance Review",
      },
      {
        key: "ANNEX_E_PROCEDURE",
        canDraftInstrument: true,
        label: "Annex E · Execution Framework",
        description:
          "Step-by-step transaction execution procedure and release framework.",
        instrumentType: "ANNEX_E_PROCEDURE",
        requiredFor: "Execution Readiness",
      },
    ],
  },
  {
    title: "Financial / Compensation",
    description:
      "Financial instrument and compensation schedules used to clarify payment mechanics and representative allocation.",
    documents: [
      {
        key: "ANNEX_F_FINANCIAL_INSTRUMENT",
        canDraftInstrument: true,
        label: "Annex F · Financial Instrument Framework",
        description:
          "DLC, SBLC, MT103, escrow, wire, or other financial instrument requirements and controls.",
        instrumentType: "ANNEX_F_FINANCIAL_INSTRUMENT",
        requiredFor: "Financial Instrument Readiness",
      },
      {
        key: "ANNEX_G_COMPENSATION_SCHEDULE",
        canDraftInstrument: true,
        label: "Annex G · Compensation Schedule",
        description:
          "Commission, representative compensation, payout timing, authorization, and confidentiality schedule.",
        instrumentType: "ANNEX_G_COMPENSATION_SCHEDULE",
        requiredFor: "Compensation Readiness",
      },
    ],
  },
  {
    title: "Route-Specific Execution",
    description:
      "Execution-lane records used after SPA execution when the dossier follows escrow, direct payment, crypto, financial instrument, or refinery settlement paths.",
    documents: [
      {
        key: "ESCROW_SETUP_INSTRUCTION",
        canDraftInstrument: true,
        label: "Escrow Setup Instruction",
        description:
          "Internal instruction record for escrow setup, escrow coordinates, and funding pathway confirmation.",
        instrumentType: "ESCROW_SETUP_INSTRUCTION",
        requiredFor: "Escrow Route",
      },
      {
        key: "PAYMENT_INSTRUCTION_SHEET",
        canDraftInstrument: true,
        label: "Payment Instruction Sheet",
        description:
          "Payment instruction record for MT103, direct wire, cash, or receiving-party settlement coordination.",
        instrumentType: "PAYMENT_INSTRUCTION_SHEET",
        requiredFor: "Direct Payment Route",
      },
      {
        key: "PAYMENT_CONFIRMATION",
        label: "Payment Confirmation Evidence",
        description:
          "Evidence record for bank wire, cash settlement, or receiving-party payment confirmation.",
        instrumentType: "PAYMENT_CONFIRMATION",
        requiredFor: "Payment Confirmation",
      },
      {
        key: "CRYPTO_SETTLEMENT_INSTRUCTION",
        canDraftInstrument: true,
        label: "Crypto Settlement Instruction",
        description:
          "Settlement instruction record for stablecoin/token, network, wallet, and treasury handling.",
        instrumentType: "CRYPTO_SETTLEMENT_INSTRUCTION",
        requiredFor: "Crypto Settlement Route",
      },
      {
        key: "WALLET_CONFIRMATION_SHEET",
        canDraftInstrument: true,
        label: "Wallet Confirmation Sheet",
        description:
          "Wallet confirmation record for recipient address, network, asset, sender context, and treasury acknowledgment.",
        instrumentType: "WALLET_CONFIRMATION_SHEET",
        requiredFor: "Crypto Wallet Confirmation",
      },
      {
        key: "CRYPTO_RECEIPT_EVIDENCE",
        label: "Crypto Receipt Evidence",
        description:
          "On-chain receipt record for transaction hash, sender wallet, network, asset, amount, and confirmation posture.",
        instrumentType: "CRYPTO_RECEIPT_EVIDENCE",
        requiredFor: "Crypto Receipt Confirmation",
      },
      {
        key: "FINANCIAL_INSTRUMENT_REVIEW_SHEET",
        canDraftInstrument: true,
        label: "Financial Instrument Review Sheet",
        description:
          "Review record for DLC, SBLC, letter-of-credit, issuing institution, coverage, beneficiary, and validity.",
        instrumentType: "FINANCIAL_INSTRUMENT_REVIEW_SHEET",
        requiredFor: "Financial Instrument Route",
      },
      {
        key: "FINANCIAL_INSTRUMENT_EVIDENCE",
        label: "Financial Instrument Evidence",
        description:
          "Evidence record for the received DLC, SBLC, letter-of-credit, or related bank instrument.",
        instrumentType: "FINANCIAL_INSTRUMENT_EVIDENCE",
        requiredFor: "Financial Instrument Confirmation",
      },
      {
        key: "REFINERY_COORDINATION_SHEET",
        canDraftInstrument: true,
        label: "Refinery Coordination Sheet",
        description:
          "Coordination record for refinery identity, procedure, intake conditions, assay posture, and delivery handoff.",
        instrumentType: "REFINERY_COORDINATION_SHEET",
        requiredFor: "Refinery Route",
      },
    ],
  },
  {
    title: "Export / Execution",
    description:
      "Notices and instruments used once the dossier moves from commercial readiness into movement.",
    documents: [
      {
        key: "EXPORT_RELEASE_NOTICE",
        canDraftInstrument: true,
        label: "Export Release Notice",
        description:
          "Notice confirming export release conditions are satisfied.",
        instrumentType: "EXPORT_RELEASE_NOTICE",
        requiredFor: "Export Release",
      },
      {
        key: "EXPORT_ACTIVATION_NOTICE",
        canDraftInstrument: true,
        label: "Export Activation Notice",
        description:
          "Notice confirming export activation and operational movement.",
        instrumentType: "EXPORT_ACTIVATION_NOTICE",
        requiredFor: "Export Active",
      },
    ],
  },
];

export function getRequiredDossierDocuments() {
  return DOSSIER_DOCUMENT_GROUPS.flatMap((group) => group.documents);
}

export function getRequiredDossierDocumentCount() {
  return getRequiredDossierDocuments().length;
}

export function findRequiredDossierDocumentByInstrumentType(
  instrumentType: string,
) {
  return getRequiredDossierDocuments().find(
    (
      document,
    ): document is RequiredDossierDocument & {
      instrumentType: DossierInstrumentType;
    } => document.instrumentType === instrumentType,
  );
}
