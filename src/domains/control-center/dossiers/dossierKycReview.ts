export const DOSSIER_KYC_REVIEW_CONFIRMED_EVENT =
  "DOSSIER_KYC_REVIEW_CONFIRMED";

export type DossierKycParty = {
  id?: string;
  role: string;
  legalName: string | null;
  representative?: string | null;
  country?: string | null;
  notes?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type DossierKycSourceOpportunity = {
  id: string;
  source?: string | null;
  title?: string | null;
};

export type DossierKycEvent = {
  eventType: string;
  createdAt: Date | string;
};

export type DossierKycReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type DossierKycReadiness = {
  passed: boolean;
  checks: DossierKycReadinessCheck[];
};

function hasText(
  value: string | null | undefined,
) {
  return Boolean(value?.trim());
}

function toTime(
  value: Date | string | null | undefined,
) {
  if (!value) return 0;

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  const time = date.getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}

export function evaluateDossierKycReadiness({
  parties,
  sourceOpportunities,
}: {
  parties: DossierKycParty[];
  sourceOpportunities: DossierKycSourceOpportunity[];
}): DossierKycReadiness {
  const buyer =
    parties.find(
      (party) => party.role === "BUYER",
    ) ?? null;

  const seller =
    parties.find(
      (party) => party.role === "SELLER",
    ) ?? null;

  const hasSourceTrace =
    sourceOpportunities.length > 0;

  const checks: DossierKycReadinessCheck[] = [
    {
      id: "buyer-identity",
      label: "Buyer legal identity",
      passed: hasText(buyer?.legalName),
      detail:
        "A BUYER legal name must be attached before the KYC review can be dispositioned for SPA drafting.",
    },
    {
      id: "buyer-representative",
      label: "Buyer representative",
      passed: hasText(buyer?.representative),
      detail:
        "A buyer representative or authorized contact must be identified before the review can be confirmed.",
    },
    {
      id: "buyer-jurisdiction",
      label: "Buyer jurisdiction",
      passed: hasText(buyer?.country),
      detail:
        "Buyer country or jurisdiction context must be present before the review can be confirmed.",
    },
    {
      id: "buyer-authority-context",
      label: "Buyer authority context",
      passed: hasText(buyer?.notes),
      detail:
        "Authority, mandate, representative, or operator review context must be recorded on the BUYER party.",
    },
    {
      id: "seller-or-source-trace",
      label: "Seller or source trace",
      passed:
        hasText(seller?.legalName) ||
        hasSourceTrace,
      detail:
        "A SELLER party or canonical promoted-opportunity source trace must exist before SPA drafting.",
    },
  ];

  return {
    passed:
      checks.every(
        (check) => check.passed,
      ),
    checks,
  };
}

export function getDossierKycConfirmationStatus({
  parties,
  events,
}: {
  parties: DossierKycParty[];
  events: DossierKycEvent[];
}) {
  const confirmations =
    events
      .filter(
        (event) =>
          event.eventType ===
          DOSSIER_KYC_REVIEW_CONFIRMED_EVENT,
      )
      .sort(
        (a, b) =>
          toTime(b.createdAt) -
          toTime(a.createdAt),
      );

  const latestConfirmation =
    confirmations[0] ?? null;

  if (!latestConfirmation) {
    return {
      confirmed: false,
      current: false,
      stale: false,
      confirmedAt: null as string | null,
      latestPartyMutationAt:
        null as string | null,
    };
  }

  const confirmationTime =
    toTime(latestConfirmation.createdAt);

  const latestPartyMutationTime =
    parties.reduce(
      (latest, party) =>
        Math.max(
          latest,
          toTime(
            party.updatedAt ??
              party.createdAt,
          ),
        ),
      0,
    );

  const current =
    confirmationTime >=
    latestPartyMutationTime;

  return {
    confirmed: true,
    current,
    stale: !current,
    confirmedAt:
      new Date(
        confirmationTime,
      ).toISOString(),
    latestPartyMutationAt:
      latestPartyMutationTime > 0
        ? new Date(
            latestPartyMutationTime,
          ).toISOString()
        : null,
  };
}
