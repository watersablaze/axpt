type DossierInstrumentForGate = {
  type: string;
  status: string;
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

export function checkDossierArtifactGate({
  fromState,
  toState,
  instruments = [],
}: ArtifactGateInput): ArtifactGateResult {
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

  if (fromState === "TREASURY_PENDING" && toState === "EXPORT_RELEASED") {
    const checks: ArtifactGateCheck[] = [
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
          ? "Export release requires active compliance, refinery coordination, and procedure instruments."
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
