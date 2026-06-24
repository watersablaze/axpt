export type TransitionRegistryEntry = {
  transitionKey: string;
  fromState: string;
  toState: string;
  requiredApprovals: Array<{
    requiredRole: string;
    requiredCount: number;
  }>;
  generatedArtifacts: Array<{
    type: string;
    title: string;
    status: string;
    version: string;
  }>;
  consequences: Array<{
    type: string;
    label: string;
    detail: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
  }>;
};

export const transitionRegistry: Record<string, TransitionRegistryEntry> = {
  SPA_EXECUTED_TO_ESCROW_PENDING: {
    transitionKey: "SPA_EXECUTED_TO_ESCROW_PENDING",
    fromState: "SPA_EXECUTED",
    toState: "ESCROW_PENDING",

    requiredApprovals: [
      {
        requiredRole: "ADMIN_PLATFORM",
        requiredCount: 1,
      },
    ],

    generatedArtifacts: [
      {
        type: "ESCROW_SETUP_INSTRUCTION",
        title: "Escrow Setup Instruction",
        status: "DRAFT",
        version: "v1",
      },
    ],

    consequences: [
      {
        type: "ESCROW_ROUTE_OPENED",
        label: "Escrow route will be opened",
        detail:
          "The dossier will move into escrow pending status for escrow setup and funding review.",
        severity: "INFO",
      },
      {
        type: "INSTRUMENT_GENERATED",
        label: "Escrow setup instruction will be generated",
        detail:
          "The system will create a draft escrow setup instruction attached to the dossier.",
        severity: "INFO",
      },
      {
        type: "DOMAIN_EVENT_APPENDED",
        label: "Operational timeline will be updated",
        detail:
          "A dossier domain event will be appended to the operational timeline.",
        severity: "INFO",
      },
    ],
  },

  SPA_EXECUTED_TO_PAYMENT_INSTRUCTION_PENDING: {
    transitionKey: "SPA_EXECUTED_TO_PAYMENT_INSTRUCTION_PENDING",
    fromState: "SPA_EXECUTED",
    toState: "PAYMENT_INSTRUCTION_PENDING",

    requiredApprovals: [
      {
        requiredRole: "ADMIN_PLATFORM",
        requiredCount: 1,
      },
    ],

    generatedArtifacts: [
      {
        type: "PAYMENT_INSTRUCTION_SHEET",
        title: "Payment Instruction Sheet",
        status: "DRAFT",
        version: "v1",
      },
    ],

    consequences: [
      {
        type: "DIRECT_PAYMENT_ROUTE_OPENED",
        label: "Direct payment route will be opened",
        detail:
          "The dossier will move into payment instruction pending status for bank, wire, or cash settlement coordination.",
        severity: "INFO",
      },
      {
        type: "INSTRUMENT_GENERATED",
        label: "Payment instruction sheet will be generated",
        detail:
          "The system will create a draft payment instruction sheet attached to the dossier.",
        severity: "INFO",
      },
      {
        type: "DOMAIN_EVENT_APPENDED",
        label: "Operational timeline will be updated",
        detail:
          "A dossier domain event will be appended to the operational timeline.",
        severity: "INFO",
      },
    ],
  },

  SPA_EXECUTED_TO_CRYPTO_WALLET_CONFIRMATION: {
    transitionKey: "SPA_EXECUTED_TO_CRYPTO_WALLET_CONFIRMATION",
    fromState: "SPA_EXECUTED",
    toState: "CRYPTO_WALLET_CONFIRMATION",

    requiredApprovals: [
      {
        requiredRole: "ADMIN_PLATFORM",
        requiredCount: 1,
      },
    ],

    generatedArtifacts: [
      {
        type: "CRYPTO_SETTLEMENT_INSTRUCTION",
        title: "Crypto Settlement Instruction",
        status: "DRAFT",
        version: "v1",
      },
      {
        type: "WALLET_CONFIRMATION_SHEET",
        title: "Wallet Confirmation Sheet",
        status: "DRAFT",
        version: "v1",
      },
    ],

    consequences: [
      {
        type: "CRYPTO_ROUTE_OPENED",
        label: "Crypto settlement route will be opened",
        detail:
          "The dossier will move into wallet confirmation before any crypto receipt or treasury movement is recognized.",
        severity: "WARNING",
      },
      {
        type: "WALLET_CONFIRMATION_REQUIRED",
        label: "Wallet confirmation will be required",
        detail:
          "Asset, network, recipient wallet, sender context, and treasury acknowledgment must be confirmed before crypto settlement can proceed.",
        severity: "WARNING",
      },
      {
        type: "DOMAIN_EVENT_APPENDED",
        label: "Operational timeline will be updated",
        detail:
          "A dossier domain event will be appended to the operational timeline.",
        severity: "INFO",
      },
    ],
  },

  SPA_EXECUTED_TO_FINANCIAL_INSTRUMENT_PENDING: {
    transitionKey: "SPA_EXECUTED_TO_FINANCIAL_INSTRUMENT_PENDING",
    fromState: "SPA_EXECUTED",
    toState: "FINANCIAL_INSTRUMENT_PENDING",

    requiredApprovals: [
      {
        requiredRole: "ADMIN_PLATFORM",
        requiredCount: 1,
      },
    ],

    generatedArtifacts: [
      {
        type: "FINANCIAL_INSTRUMENT_REVIEW_SHEET",
        title: "Financial Instrument Review Sheet",
        status: "DRAFT",
        version: "v1",
      },
    ],

    consequences: [
      {
        type: "FINANCIAL_INSTRUMENT_ROUTE_OPENED",
        label: "Financial instrument route will be opened",
        detail:
          "The dossier will move into financial instrument pending status for DLC, SBLC, or letter-of-credit review.",
        severity: "INFO",
      },
      {
        type: "INSTRUMENT_REVIEW_REQUIRED",
        label: "Instrument review will be required",
        detail:
          "Issuing institution, coverage, validity, beneficiary, and instrument evidence must be reviewed before confirmation.",
        severity: "WARNING",
      },
      {
        type: "DOMAIN_EVENT_APPENDED",
        label: "Operational timeline will be updated",
        detail:
          "A dossier domain event will be appended to the operational timeline.",
        severity: "INFO",
      },
    ],
  },

  SPA_EXECUTED_TO_REFINERY_COORDINATION: {
    transitionKey: "SPA_EXECUTED_TO_REFINERY_COORDINATION",
    fromState: "SPA_EXECUTED",
    toState: "REFINERY_COORDINATION",

    requiredApprovals: [
      {
        requiredRole: "ADMIN_PLATFORM",
        requiredCount: 1,
      },
    ],

    generatedArtifacts: [
      {
        type: "REFINERY_COORDINATION_SHEET",
        title: "Refinery Coordination Sheet",
        status: "DRAFT",
        version: "v1",
      },
    ],

    consequences: [
      {
        type: "REFINERY_ROUTE_OPENED",
        label: "Refinery coordination route will be opened",
        detail:
          "The dossier will move into refinery coordination before release, intake, assay, or settlement events proceed.",
        severity: "INFO",
      },
      {
        type: "REFINERY_CONFIRMATION_REQUIRED",
        label: "Refinery confirmation will be required",
        detail:
          "Refinery identity, delivery procedure, intake conditions, and assay posture must be confirmed before downstream execution.",
        severity: "WARNING",
      },
      {
        type: "DOMAIN_EVENT_APPENDED",
        label: "Operational timeline will be updated",
        detail:
          "A dossier domain event will be appended to the operational timeline.",
        severity: "INFO",
      },
    ],
  },

  TREASURY_PENDING_TO_EXPORT_RELEASED: {
    transitionKey: "TREASURY_PENDING_TO_EXPORT_RELEASED",
    fromState: "TREASURY_PENDING",
    toState: "EXPORT_RELEASED",

    requiredApprovals: [
      {
        requiredRole: "ADMIN_PLATFORM",
        requiredCount: 1,
      },
    ],

    generatedArtifacts: [
      {
        type: "EXPORT_RELEASE_NOTICE",
        title: "Export Release Notice",
        status: "DRAFT",
        version: "v1",
      },
    ],

    consequences: [
      {
        type: "EXPORT_RELEASE_AUTHORIZED",
        label: "Export release will be authorized",
        detail:
          "The dossier will move into export released status after artifact and approval gates have passed.",
        severity: "INFO",
      },
      {
        type: "INSTRUMENT_GENERATED",
        label: "Export Release Notice will be generated",
        detail:
          "The system will create a draft Export Release Notice attached to the dossier.",
        severity: "INFO",
      },
      {
        type: "DOMAIN_EVENT_APPENDED",
        label: "Operational timeline will be updated",
        detail:
          "A dossier domain event will be appended to the operational timeline.",
        severity: "INFO",
      },
    ],
  },
  EXPORT_RELEASED_TO_EXPORT_ACTIVE: {
    transitionKey: "EXPORT_RELEASED_TO_EXPORT_ACTIVE",
    fromState: "EXPORT_RELEASED",
    toState: "EXPORT_ACTIVE",

    requiredApprovals: [],

    generatedArtifacts: [
      {
        type: "EXPORT_ACTIVATION_NOTICE",
        title: "Export Activation Notice",
        status: "DRAFT",
        version: "v1",
      },
    ],

    consequences: [
      {
        type: "EXPORT_ACTIVATION_RECORDED",
        label: "Export activity will be opened",
        detail:
          "The dossier will move from export released into export active status.",
        severity: "INFO",
      },
      {
        type: "INSTRUMENT_GENERATED",
        label: "Export Activation Notice will be generated",
        detail:
          "The system will create a draft Export Activation Notice attached to the dossier.",
        severity: "INFO",
      },
      {
        type: "DOMAIN_EVENT_APPENDED",
        label: "Operational timeline will be updated",
        detail:
          "A dossier domain event will be appended to the operational timeline.",
        severity: "INFO",
      },
    ],
  },
};

export function getTransitionRegistryEntry(transitionKey: string) {
  return transitionRegistry[transitionKey] ?? null;
}
