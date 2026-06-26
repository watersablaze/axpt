type DossierInstrumentForGate = {
  type: string;
  status: string;
};

type DossierPartyForGate = {
  role: string;
  legalName: string | null;
  representative?: string | null;
  country?: string | null;
  notes?: string | null;
};

type DossierSourceOpportunityForGate = {
  id: string;
  source?: string | null;
  title?: string | null;
};

export type ArtifactGateCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
};

export type ArtifactGateResult = {
  passed: boolean;
  blockingReason?: string;
  checks: ArtifactGateCheck[];
};

type ArtifactGateInput = {
  fromState: string;
  toState: string;
  instruments?: DossierInstrumentForGate[];
  parties?: DossierPartyForGate[];
  sourceOpportunities?: DossierSourceOpportunityForGate[];
  origin?: string | null;
  settlement?: string | null;
  executionProfile?: string | null;
};

function hasActiveInstrument(
  instruments: DossierInstrumentForGate[],
  type: string,
) {
  return instruments.some(
    (instrument) =>
      instrument.type === type &&
      ["ACTIVE", "EXECUTED"].includes(instrument.status),
  );
}

function hasExecutedInstrument(
  instruments: DossierInstrumentForGate[],
  type: string,
) {
  return instruments.some(
    (instrument) =>
      instrument.type === type && instrument.status === "EXECUTED",
  );
}

export function checkDossierArtifactGate({
  fromState,
  toState,
  instruments = [],
  parties = [],
  sourceOpportunities = [],
  origin = null,
  settlement = null,
  executionProfile = null,
}: ArtifactGateInput): ArtifactGateResult {
  if (fromState === "KYC_REVIEW" && toState === "SPA_DRAFTING") {
    const buyer = parties.find((party) => party.role === "BUYER");
    const seller = parties.find((party) => party.role === "SELLER");
    const hasSellerParty = Boolean(seller?.legalName?.trim());
    const hasSourceTrace = sourceOpportunities.length > 0;

    const checks: ArtifactGateCheck[] = [
      {
        id: "buyer-party-present",
        label: "Buyer party present",
        passed: Boolean(buyer?.legalName?.trim()),
        detail:
          "Go to Brief → Party Identity Review. Add or complete the BUYER party legal name before SPA drafting.",
      },
      {
        id: "source-trace-present",
        label: hasSellerParty ? "Seller party present" : "Source trace present",
        passed: hasSellerParty || hasSourceTrace,
        detail: hasSellerParty
          ? "A SELLER party record is attached to this dossier."
          : hasSourceTrace
            ? "Passed by promoted opportunity trace. Add a SELLER party record before final SPA execution if seller identity is not yet attached."
            : "Go to Brief → Party Identity Review. Add a SELLER party record, or ensure this dossier is linked to a promoted opportunity/source trace.",
      },
      {
        id: "party-review-context",
        label: "Party review context present",
        passed: parties.some(
          (party) =>
            Boolean(party.representative?.trim()) ||
            Boolean(party.country?.trim()) ||
            Boolean(party.notes?.trim()),
        ),
        detail:
          "Go to Brief → Party Identity Review. Add representative, country, notes, or an operator confirmation note to at least one party record.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "SPA drafting requires buyer identity, source trace, and party review context. Resolve in Brief → Party Identity Review."
          : undefined,
      checks,
    };
  }

  if (fromState === "SPA_DRAFTING" && toState === "SPA_EXECUTED") {
    const buyer = parties.find((party) => party.role === "BUYER");
    const seller = parties.find((party) => party.role === "SELLER");

    const checks: ArtifactGateCheck[] = [
      {
        id: "spa-executed",
        label: "SPA instrument executed",
        passed: hasExecutedInstrument(instruments, "SPA"),
        detail:
          "Go to Readiness → Document Workbench. Create the SPA draft, activate it for review, then mark it executed before recording SPA_EXECUTED.",
      },
      {
        id: "buyer-party-present",
        label: "Buyer party present",
        passed: Boolean(buyer?.legalName?.trim()),
        detail:
          "Go to Brief → Party Identity Review. A BUYER party legal name must be attached before SPA execution.",
      },
      {
        id: "seller-party-present",
        label: "Seller party present",
        passed: Boolean(seller?.legalName?.trim()),
        detail:
          "Go to Brief → Party Identity Review. Add a SELLER party record before SPA execution. Source trace alone is enough for drafting, but not for execution.",
      },
      {
        id: "origin-present",
        label: "Origin present",
        passed: Boolean(origin?.trim()),
        detail:
          "Go to Readiness → Commercial Terms Review or dossier summary source fields. Origin must be present before SPA execution because the SPA renderer requires origin context.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "SPA execution requires an executed SPA, buyer party, seller party, and origin."
          : undefined,
      checks,
    };
  }

  if (fromState === "SPA_EXECUTED" && toState === "ESCROW_PENDING") {
    const checks: ArtifactGateCheck[] = [
      {
        id: "escrow-setup-instruction",
        label: "Escrow setup instruction active",
        passed: hasActiveInstrument(instruments, "ESCROW_SETUP_INSTRUCTION"),
        detail:
          "Escrow Setup Instruction must be active or executed before the dossier can enter escrow pending.",
      },
      {
        id: "settlement-annex",
        label: "Settlement annex active",
        passed: hasActiveInstrument(instruments, "ANNEX_B_SETTLEMENT"),
        detail:
          "Annex B Settlement must be active or executed before escrow setup is treated as operational.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Escrow pending requires active escrow setup instruction and settlement annex."
          : undefined,
      checks,
    };
  }

  if (fromState === "ESCROW_PENDING" && toState === "ESCROW_FUNDED") {
    const checks: ArtifactGateCheck[] = [
      {
        id: "escrow-setup-instruction",
        label: "Escrow setup instruction active",
        passed: hasActiveInstrument(instruments, "ESCROW_SETUP_INSTRUCTION"),
        detail:
          "Escrow Setup Instruction must remain active or executed before escrow funding can be recorded.",
      },
      {
        id: "settlement-annex",
        label: "Settlement annex active",
        passed: hasActiveInstrument(instruments, "ANNEX_B_SETTLEMENT"),
        detail:
          "Annex B Settlement must be active or executed so the funding route has approved settlement context.",
      },
      {
        id: "payment-confirmation",
        label: "Escrow funding confirmation active",
        passed: hasActiveInstrument(instruments, "PAYMENT_CONFIRMATION"),
        detail:
          "Payment Confirmation must be active or executed before the dossier can enter escrow funded.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Escrow funded requires escrow setup, settlement annex, and payment confirmation."
          : undefined,
      checks,
    };
  }

  if (
    fromState === "PAYMENT_INSTRUCTION_PENDING" &&
    toState === "PAYMENT_CONFIRMED"
  ) {
    const checks: ArtifactGateCheck[] = [
      {
        id: "payment-instruction-sheet",
        label: "Payment instruction sheet active",
        passed: hasActiveInstrument(instruments, "PAYMENT_INSTRUCTION_SHEET"),
        detail:
          "Payment instruction sheet must be active or executed before payment can be confirmed.",
      },
      {
        id: "payment-evidence",
        label: "Payment evidence attached",
        passed: hasActiveInstrument(instruments, "PAYMENT_CONFIRMATION"),
        detail:
          "Wire, cash, or receiving-party confirmation evidence must be active or executed.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Payment confirmation requires active payment instructions and payment evidence."
          : undefined,
      checks,
    };
  }

  if (
    fromState === "CRYPTO_WALLET_CONFIRMATION" &&
    toState === "CRYPTO_RECEIVED"
  ) {
    const checks: ArtifactGateCheck[] = [
      {
        id: "crypto-settlement-instruction",
        label: "Crypto settlement instruction active",
        passed: hasActiveInstrument(
          instruments,
          "CRYPTO_SETTLEMENT_INSTRUCTION",
        ),
        detail:
          "Crypto settlement instruction must be active or executed before receipt can be recognized.",
      },
      {
        id: "wallet-confirmation-sheet",
        label: "Wallet confirmation sheet active",
        passed: hasActiveInstrument(instruments, "WALLET_CONFIRMATION_SHEET"),
        detail:
          "Recipient wallet, network, asset, and treasury acknowledgment must be confirmed.",
      },
      {
        id: "crypto-receipt-evidence",
        label: "Crypto receipt evidence attached",
        passed: hasActiveInstrument(instruments, "CRYPTO_RECEIPT_EVIDENCE"),
        detail:
          "Transaction hash, sender wallet context, network, and amount evidence must be active or executed.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Crypto receipt requires settlement instructions, wallet confirmation, and on-chain receipt evidence."
          : undefined,
      checks,
    };
  }

  if (
    fromState === "FINANCIAL_INSTRUMENT_PENDING" &&
    toState === "FINANCIAL_INSTRUMENT_CONFIRMED"
  ) {
    const checks: ArtifactGateCheck[] = [
      {
        id: "financial-instrument-review",
        label: "Financial instrument review active",
        passed: hasActiveInstrument(
          instruments,
          "FINANCIAL_INSTRUMENT_REVIEW_SHEET",
        ),
        detail: "Financial instrument review sheet must be active or executed.",
      },
      {
        id: "instrument-evidence",
        label: "Instrument evidence attached",
        passed: hasActiveInstrument(
          instruments,
          "FINANCIAL_INSTRUMENT_EVIDENCE",
        ),
        detail:
          "DLC, SBLC, or letter-of-credit evidence must be active or executed.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Financial instrument confirmation requires review and instrument evidence."
          : undefined,
      checks,
    };
  }

  if (fromState === "REFINERY_COORDINATION" && toState === "EXPORT_RELEASED") {
    const checks: ArtifactGateCheck[] = [
      {
        id: "refinery-coordination-sheet",
        label: "Refinery coordination sheet active",
        passed: hasActiveInstrument(instruments, "REFINERY_COORDINATION_SHEET"),
        detail:
          "Refinery coordination sheet must be active or executed before export release.",
      },
      {
        id: "refinery-procedure",
        label: "Refinery procedure active",
        passed:
          hasActiveInstrument(instruments, "ANNEX_C_REFINERY") ||
          hasActiveInstrument(instruments, "ANNEX_E_PROCEDURE"),
        detail:
          "Refinery coordination or procedure documentation must be active or executed.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Refinery route export release requires active refinery coordination and procedure documentation."
          : undefined,
      checks,
    };
  }

  if (fromState === "ESCROW_FUNDED" && toState === "TREASURY_PENDING") {
    const checks: ArtifactGateCheck[] = [
      {
        id: "payment-confirmation",
        label: "Escrow funding confirmation active",
        passed: hasActiveInstrument(instruments, "PAYMENT_CONFIRMATION"),
        detail:
          "Payment Confirmation must remain active or executed before treasury review can begin.",
      },
      {
        id: "settlement-annex",
        label: "Settlement annex active",
        passed: hasActiveInstrument(instruments, "ANNEX_B_SETTLEMENT"),
        detail:
          "Annex B Settlement must remain active or executed so treasury review has settlement context.",
      },
      {
        id: "escrow-setup-instruction",
        label: "Escrow setup instruction active",
        passed: hasActiveInstrument(instruments, "ESCROW_SETUP_INSTRUCTION"),
        detail:
          "Escrow Setup Instruction must remain active or executed so treasury review has escrow context.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Treasury pending requires escrow funding confirmation, settlement annex, and escrow setup instruction."
          : undefined,
      checks,
    };
  }

  if (fromState === "TREASURY_PENDING" && toState === "EXPORT_RELEASED") {
    const isEscrowSettlement =
      executionProfile === "ESCROW_SETTLEMENT" ||
      Boolean(settlement?.toLowerCase().includes("escrow"));

    const checks: ArtifactGateCheck[] = isEscrowSettlement
      ? [
          {
            id: "payment-confirmation",
            label: "Escrow funding confirmation active",
            passed: hasActiveInstrument(instruments, "PAYMENT_CONFIRMATION"),
            detail:
              "Payment Confirmation must be active or executed before export release can be authorized from an escrow settlement route.",
          },
          {
            id: "settlement-annex",
            label: "Settlement annex active",
            passed: hasActiveInstrument(instruments, "ANNEX_B_SETTLEMENT"),
            detail:
              "Annex B Settlement must be active or executed before export release can be authorized.",
          },
          {
            id: "escrow-setup-instruction",
            label: "Escrow setup instruction active",
            passed: hasActiveInstrument(
              instruments,
              "ESCROW_SETUP_INSTRUCTION",
            ),
            detail:
              "Escrow Setup Instruction must be active or executed before export release can be authorized.",
          },
          {
            id: "compliance-package",
            label: "Compliance package active",
            passed: hasActiveInstrument(instruments, "ANNEX_D_COMPLIANCE"),
            detail:
              "Annex D Compliance must be active or executed before export release.",
          },
        ]
      : [
          {
            id: "compliance-package",
            label: "Compliance package active",
            passed: hasActiveInstrument(instruments, "ANNEX_D_COMPLIANCE"),
            detail: "Annex D must be active or executed.",
          },
          {
            id: "refinery-coordination",
            label: "Refinery coordination active",
            passed: hasActiveInstrument(instruments, "ANNEX_C_REFINERY"),
            detail: "Annex C must be active or executed.",
          },
          {
            id: "procedure-sheet",
            label: "Procedure sheet active",
            passed: hasActiveInstrument(instruments, "ANNEX_E_PROCEDURE"),
            detail: "Annex E must be active or executed.",
          },
        ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? isEscrowSettlement
            ? "Escrow export release requires payment confirmation, settlement annex, escrow setup, and compliance package."
            : "Export release requires active compliance, refinery coordination, and procedure instruments."
          : undefined,
      checks,
    };
  }

  if (fromState === "EXPORT_RELEASED" && toState === "EXPORT_ACTIVE") {
    const checks: ArtifactGateCheck[] = [
      {
        id: "export-release-notice",
        label: "Export release notice active",
        passed: hasActiveInstrument(instruments, "EXPORT_RELEASE_NOTICE"),
        detail:
          "Export Release Notice must be active or executed before export activity can be opened.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Export activation requires an active or executed Export Release Notice."
          : undefined,
      checks,
    };
  }

  if (fromState === "EXPORT_ACTIVE" && toState === "IN_TRANSIT") {
    const checks: ArtifactGateCheck[] = [
      {
        id: "export-activation-notice",
        label: "Export activation notice active",
        passed: hasActiveInstrument(instruments, "EXPORT_ACTIVATION_NOTICE"),
        detail:
          "Export Activation Notice must be active or executed before movement can be opened as IN_TRANSIT.",
      },
    ];

    const failed = checks.filter((check) => !check.passed);

    return {
      passed: failed.length === 0,
      blockingReason:
        failed.length > 0
          ? "Transit requires an active or executed Export Activation Notice."
          : undefined,
      checks,
    };
  }

  if (fromState === "REFINERY_ASSAY" && toState === "SETTLEMENT_PENDING") {
    const checks: ArtifactGateCheck[] = [
      {
        id: "assay-confirmation",
        label: "Assay confirmation finalized",
        passed: false,
        detail:
          "Final assay confirmation must be attached before settlement preparation.",
      },
      {
        id: "treasury-reconciliation",
        label: "Treasury reconciliation complete",
        passed: false,
        detail:
          "Treasury reconciliation must be completed before settlement preparation.",
      },
    ];

    return {
      passed: false,
      blockingReason:
        "Settlement preparation requires finalized assay confirmation and treasury reconciliation.",
      checks,
    };
  }

  return {
    passed: true,
    checks: [
      {
        id: "baseline",
        label: "No active artifact gate",
        passed: true,
        detail: "Current transition has no blocking artifact requirements.",
      },
    ],
  };
}
