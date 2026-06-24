import { getNextDossierStates } from "./dossierStateMachine";
import {
  type DossierExecutionProfile,
  getExecutionProfileLabel,
  inferDossierExecutionProfile,
} from "./inferDossierExecutionProfile";

export type AvailableDossierTransition = {
  transitionKey: string;
  fromState: string;
  toState: string;
  label: string;
  profile: DossierExecutionProfile;
  profileLabel: string;
  recommended: boolean;
  reason: string;
};

type AvailableDossierTransitionsInput = {
  state: string;
  settlement?: string | null;
  transactionType?: string | null;
  terms?: {
    settlementMethod?: string | null;
    financialInstrumentType?: string | null;
    compensationPaymentMethod?: string | null;
    compensationConfidentialityNote?: string | null;
  } | null;
};

function transitionKey(fromState: string, toState: string) {
  return `${fromState}_TO_${toState}`;
}

function labelForTransition(toState: string) {
  return toState
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function expectedPostSpaState(profile: DossierExecutionProfile) {
  switch (profile) {
    case "ESCROW_SETTLEMENT":
      return "ESCROW_PENDING";

    case "DIRECT_WIRE":
    case "CASH_AND_CARRY":
    case "HAND_CARRY_EXPORT":
      return "PAYMENT_INSTRUCTION_PENDING";

    case "CRYPTO_SETTLEMENT":
      return "CRYPTO_WALLET_CONFIRMATION";

    case "DLC_OR_SBLC":
      return "FINANCIAL_INSTRUMENT_PENDING";

    case "REFINERY_SETTLEMENT":
      return "REFINERY_COORDINATION";

    case "MANUAL_REVIEW":
    default:
      return "BLOCKED";
  }
}

function profileAllowsTransition({
  profile,
  fromState,
  toState,
}: {
  profile: DossierExecutionProfile;
  fromState: string;
  toState: string;
}) {
  if (["INTAKE_PENDING", "KYC_REVIEW", "SPA_DRAFTING"].includes(fromState)) {
    return true;
  }

  if (fromState === "SPA_EXECUTED") {
    return toState === expectedPostSpaState(profile);
  }

  if (
    profile !== "ESCROW_SETTLEMENT" &&
    ["ESCROW_PENDING", "ESCROW_FUNDED"].includes(fromState)
  ) {
    return false;
  }

  if (
    profile !== "CRYPTO_SETTLEMENT" &&
    ["CRYPTO_WALLET_CONFIRMATION", "CRYPTO_RECEIVED"].includes(fromState)
  ) {
    return false;
  }

  if (
    !["DIRECT_WIRE", "CASH_AND_CARRY", "HAND_CARRY_EXPORT"].includes(profile) &&
    ["PAYMENT_INSTRUCTION_PENDING", "PAYMENT_CONFIRMED"].includes(fromState)
  ) {
    return false;
  }

  if (
    profile !== "DLC_OR_SBLC" &&
    ["FINANCIAL_INSTRUMENT_PENDING", "FINANCIAL_INSTRUMENT_CONFIRMED"].includes(
      fromState,
    )
  ) {
    return false;
  }

  if (
    profile !== "REFINERY_SETTLEMENT" &&
    fromState === "REFINERY_COORDINATION"
  ) {
    return false;
  }

  return true;
}

function reasonForTransition({
  profile,
  fromState,
  toState,
}: {
  profile: DossierExecutionProfile;
  fromState: string;
  toState: string;
}) {
  if (fromState === "SPA_EXECUTED") {
    switch (toState) {
      case "ESCROW_PENDING":
        return "Escrow path is available because the dossier profile indicates escrow settlement.";

      case "PAYMENT_INSTRUCTION_PENDING":
        return `${getExecutionProfileLabel(
          profile,
        )} path is available because the dossier requires payment instruction and confirmation before treasury movement.`;

      case "CRYPTO_WALLET_CONFIRMATION":
        return "Crypto settlement path is available because the dossier references wallet, stablecoin, or blockchain settlement terms.";

      case "FINANCIAL_INSTRUMENT_PENDING":
        return "Financial instrument path is available because the dossier profile indicates DLC, SBLC, or letter-of-credit settlement.";

      case "REFINERY_COORDINATION":
        return "Refinery coordination path is available because settlement depends on refinery coordination, intake, or assay posture.";

      case "BLOCKED":
        return `${getExecutionProfileLabel(
          profile,
        )} requires operator review before execution can continue.`;

      default:
        break;
    }
  }

  if (
    fromState === "CRYPTO_WALLET_CONFIRMATION" &&
    toState === "CRYPTO_RECEIVED"
  ) {
    return "Crypto receipt requires wallet, network, asset, sender, and treasury confirmation before funds are treated as received.";
  }

  if (
    fromState === "PAYMENT_INSTRUCTION_PENDING" &&
    toState === "PAYMENT_CONFIRMED"
  ) {
    return "Payment confirmation requires bank/wire evidence and receiving-party acknowledgment.";
  }

  if (
    fromState === "FINANCIAL_INSTRUMENT_PENDING" &&
    toState === "FINANCIAL_INSTRUMENT_CONFIRMED"
  ) {
    return "Financial instrument confirmation requires instrument evidence, issuing institution details, coverage, and validity review.";
  }

  return "Transition is available under the current dossier lifecycle and execution profile.";
}

export function getAvailableDossierTransitions(
  input: AvailableDossierTransitionsInput,
): AvailableDossierTransition[] {
  const profile = inferDossierExecutionProfile(input);
  const nextStates = getNextDossierStates(input.state);
  const profileLabel = getExecutionProfileLabel(profile);

  return nextStates
    .filter((toState) =>
      profileAllowsTransition({
        profile,
        fromState: input.state,
        toState,
      }),
    )
    .map((toState) => ({
      transitionKey: transitionKey(input.state, toState),
      fromState: input.state,
      toState,
      label: labelForTransition(toState),
      profile,
      profileLabel,
      recommended:
        input.state === "SPA_EXECUTED"
          ? toState === expectedPostSpaState(profile)
          : true,
      reason: reasonForTransition({
        profile,
        fromState: input.state,
        toState,
      }),
    }));
}
