export type DossierExecutionProfile =
  | "ESCROW_SETTLEMENT"
  | "DIRECT_WIRE"
  | "CRYPTO_SETTLEMENT"
  | "CASH_AND_CARRY"
  | "DLC_OR_SBLC"
  | "REFINERY_SETTLEMENT"
  | "HAND_CARRY_EXPORT"
  | "MANUAL_REVIEW";

type DossierExecutionProfileInput = {
  settlement?: string | null;
  transactionType?: string | null;
  terms?: {
    settlementMethod?: string | null;
    financialInstrumentType?: string | null;
    compensationPaymentMethod?: string | null;
    compensationConfidentialityNote?: string | null;
  } | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function inferDossierExecutionProfile({
  settlement,
  transactionType,
  terms,
}: DossierExecutionProfileInput): DossierExecutionProfile {
  const haystack = [
    settlement,
    transactionType,
    terms?.settlementMethod,
    terms?.financialInstrumentType,
    terms?.compensationPaymentMethod,
    terms?.compensationConfidentialityNote,
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" | ");

  if (!haystack) {
    return "MANUAL_REVIEW";
  }

  if (
    includesAny(haystack, [
      "crypto",
      "usdt",
      "usdc",
      "stablecoin",
      "erc20",
      "erc-20",
      "trc20",
      "trc-20",
      "polygon",
      "ethereum",
      "wallet",
      "blockchain",
      "digital asset",
    ])
  ) {
    return "CRYPTO_SETTLEMENT";
  }

  if (includesAny(haystack, ["escrow", "trust account", "iolta"])) {
    return "ESCROW_SETTLEMENT";
  }

  if (
    includesAny(haystack, [
      "dlc",
      "sblc",
      "letter of credit",
      "standby letter",
      "documentary letter",
    ])
  ) {
    return "DLC_OR_SBLC";
  }

  if (
    includesAny(haystack, [
      "mt103",
      "wire",
      "swift",
      "bank transfer",
      "direct wire",
    ])
  ) {
    return "DIRECT_WIRE";
  }

  if (
    includesAny(haystack, [
      "cash",
      "cash and carry",
      "cash & carry",
      "hand carry",
      "hand-carry",
    ])
  ) {
    return includesAny(haystack, ["hand carry", "hand-carry"])
      ? "HAND_CARRY_EXPORT"
      : "CASH_AND_CARRY";
  }

  if (
    includesAny(haystack, [
      "refinery settlement",
      "settlement at refinery",
      "refinery",
      "assay settlement",
    ])
  ) {
    return "REFINERY_SETTLEMENT";
  }

  return "MANUAL_REVIEW";
}

export function getExecutionProfileLabel(profile: DossierExecutionProfile) {
  switch (profile) {
    case "ESCROW_SETTLEMENT":
      return "Escrow Settlement";

    case "DIRECT_WIRE":
      return "Direct Wire / MT103";

    case "CRYPTO_SETTLEMENT":
      return "Crypto Settlement";

    case "CASH_AND_CARRY":
      return "Cash & Carry";

    case "DLC_OR_SBLC":
      return "DLC / SBLC";

    case "REFINERY_SETTLEMENT":
      return "Refinery Settlement";

    case "HAND_CARRY_EXPORT":
      return "Hand-Carry Export";

    case "MANUAL_REVIEW":
    default:
      return "Manual Review";
  }
}
