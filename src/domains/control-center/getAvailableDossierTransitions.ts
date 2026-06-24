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
    switch (profile) {
      case "ESCROW_SETTLEMENT":
        return toState === "ESCROW_PENDING";

      case "DIRECT_WIRE":
      case "CRYPTO_SETTLEMENT":
      case "CASH_AND_CARRY":
      case "HAND_CARRY_EXPORT":
      case "DLC_OR_SBLC":
      case "REFINERY_SETTLEMENT":
      case "MANUAL_REVIEW":
        return toState === "BLOCKED";
    }
  }

  if (
    profile !== "ESCROW_SETTLEMENT" &&
    ["ESCROW_PENDING", "ESCROW_FUNDED"].includes(fromState)
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
  if (fromState === "SPA_EXECUTED" && toState === "ESCROW_PENDING") {
    return "Escrow path is available because the dossier profile indicates escrow settlement.";
  }

  if (fromState === "SPA_EXECUTED" && toState === "BLOCKED") {
    return `${getExecutionProfileLabel(
      profile,
    )} requires route-specific transition coverage before execution can continue.`;
  }

  return "Transition is available under the current dossier lifecycle.";
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
          ? profile === "ESCROW_SETTLEMENT"
            ? toState === "ESCROW_PENDING"
            : toState === "BLOCKED"
          : true,
      reason: reasonForTransition({
        profile,
        fromState: input.state,
        toState,
      }),
    }));
}
