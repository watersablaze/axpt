export const GOLD_SPA_V1 = {
  id: "GOLD_SPA_V1",
  label: "Gold Sales & Purchase Agreement v1",
  workflowType: "GOLD_SPA",
  mode: "GOLD_SPA_PROTOCOL",

  defaults: {
    commodity: "Gold (AU)",
    commodityForm: "Doré Bars",
    originCountry: "Republic of Mali",
    purityText: "96%+",
    caratsText: "22+",
    pricingFormula:
      "LBMA 2nd Fix price on day of assay (or previous market day if closed)",
    currency: "USD",
    titleTransferRule:
      "Title transfers only after confirmed payment following final assay",
  },

  partyBlueprint: [
    {
      role: "SELLER",
      label: "Seller",
      required: true,
    },
    {
      role: "BUYER",
      label: "Buyer",
      required: true,
    },
    {
      role: "ESCROW_AGENT",
      label: "Escrow Agent / Counsel",
      required: false,
    },
    {
      role: "REFINERY",
      label: "Refinery",
      required: false,
    },
    {
      role: "CUSTOMS_AGENT",
      label: "Customs Agent",
      required: false,
    },
    {
      role: "INTERNAL_OPERATOR",
      label: "Internal Operator",
      required: true,
    },
  ],

  requiredArtifacts: [
    "SPA_DRAFT",
    "SPA_FINAL",
    "SELLER_PASSPORT",
    "BUYER_PASSPORT",
    "BANK_COORDINATES",
    "COMMERCIAL_INVOICE",
  ],

  optionalArtifacts: [
    "BUYER_KYC",
    "SELLER_KYC",
    "COMPANY_REGISTRATION",
    "PROOF_OF_FUNDS",
    "ASSAY_REPORT",
    "ESCROW_INSTRUCTIONS",
    "EXPORT_DOCS",
    "SHIPPING_DOCS",
    "POP_VIDEO_CONFIRMATION",
    "REFINERY_CONFIRMATION",
  ],

  gates: [
    {
      key: "CASE_INTAKE",
      name: "Case Intake",
      gateType: "INTAKE",
      ord: 1,
      description:
        "Core case metadata, protocol selection, and parties are initialized.",
    },
    {
      key: "PARTY_VERIFICATION",
      name: "Party Verification",
      gateType: "KYC",
      ord: 2,
      description:
        "Buyer and seller identities, authority, and supporting records are confirmed.",
    },
    {
      key: "COMMERCIAL_TERMS",
      name: "Commercial Terms Locked",
      gateType: "COMMERCIAL",
      ord: 3,
      description:
        "Commodity, purity, quantity, pricing formula, destination, and transaction type are confirmed.",
    },
    {
      key: "DOCUMENT_READINESS",
      name: "Document Readiness",
      gateType: "DOCUMENT",
      ord: 4,
      description:
        "SPA final draft and required supporting documents are present.",
    },
    {
      key: "SPA_EXECUTION",
      name: "SPA Execution",
      gateType: "SIGNATURE",
      ord: 5,
      description:
        "Buyer and seller countersign the SPA. Electronic signatures accepted.",
    },
    {
      key: "ESCROW_SETUP",
      name: "Escrow Setup",
      gateType: "ESCROW",
      ord: 6,
      description:
        "Escrow instructions, banking coordinates, and release conditions are confirmed.",
    },
    {
      key: "FUNDING_CONFIRMATION",
      name: "Funding Confirmation",
      gateType: "FUNDING",
      ord: 7,
      description:
        "Buyer funds are confirmed or locked as required by the transaction structure.",
    },
    {
      key: "ASSAY_CONFIRMATION",
      name: "Assay Confirmation",
      gateType: "ASSAY",
      ord: 8,
      description:
        "Final assay is acknowledged for pricing and acceptance.",
    },
    {
      key: "TITLE_RELEASE",
      name: "Title & Release Authorization",
      gateType: "RELEASE",
      ord: 9,
      description:
        "Title passes only after confirmed payment in accordance with SPA terms.",
    },
    {
      key: "CASE_COMPLETION",
      name: "Case Completion",
      gateType: "COMPLETION",
      ord: 10,
      description:
        "Transaction is completed, archived, and ready for reporting.",
    },
  ],

  interventionRules: [
    {
      code: "NO_GATES_DEFINED",
      when: "case_has_no_gates",
      level: "WARNING",
      message: "System is blocked — no gates defined",
      suggestedAction: "Create verification gates",
    },
    {
      code: "NO_COUNTERSIGNATURE",
      when: "spa_not_countersigned",
      level: "CRITICAL",
      message: "SPA is not fully executed",
      suggestedAction: "Collect buyer and seller countersignatures",
    },
    {
      code: "MISSING_REQUIRED_DOCS",
      when: "required_artifacts_missing",
      level: "WARNING",
      message: "Required transaction documents are missing",
      suggestedAction: "Upload missing artifacts before progression",
    },
    {
      code: "TITLE_RELEASE_BLOCKED",
      when: "payment_not_confirmed",
      level: "CRITICAL",
      message: "Title cannot transfer before confirmed payment",
      suggestedAction: "Confirm funding / escrow before release",
    },
  ],
} as const