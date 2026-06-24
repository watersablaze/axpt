"use client";

import { useEffect, useState } from "react";

import DossierWorkspaceHeader from "./DossierWorkspaceHeader";
import DossierOverviewCard from "./DossierOverviewCard";
import { DossierPartyCompletionPanel } from "./DossierPartyCompletionPanel";
import DossierExecutionCard from "./DossierExecutionCard";
import DossierTimelinePanel from "./DossierTimelinePanel";
import DossierDocumentsPanel from "./DossierDocumentsPanel";
import { DossierTermsPanel } from "./DossierTermsPanel";
import { DossierBankCoordinatesPanel } from "./DossierBankCoordinatesPanel";
import { DossierReleaseConditionsPanel } from "./DossierReleaseConditionsPanel";
import { DossierIssuanceApprovalPanel } from "./DossierIssuanceApprovalPanel";
import TransitionActionBar from "./TransitionActionBar";
import DossierCommandPanel from "./DossierCommandPanel";
import DossierMissionPanel from "./DossierMissionPanel";
import DossierWorkspaceTabs, {
  type DossierWorkspaceTab,
} from "./DossierWorkspaceTabs";
import { getRequiredDossierDocuments } from "@/domains/control-center/dossiers/documentRequirements";
import { OperatorPathStrip } from "./OperatorPathStrip";

type DossierParty = {
  id: string;
  role: string;
  legalName: string;
  representative: string | null;
  country: string | null;
  notes: string | null;
};

type DossierInstrument = {
  id: string;
  type: string;
  status: string;
  version: string;
  title: string;
};

type DossierEvent = {
  id: string;
  eventType: string;
  message: string;
  actor: string | null;
  createdAt: string;
};

type DossierTerms = {
  settlementMethod: string | null;
  financialInstrumentType: string | null;
  issuingInstitution: string | null;
  instrumentAmountOrCoverage: string | null;
  validityPeriod: string | null;
  paymentTrigger: string | null;
  beneficiary: string | null;
  sellerSideCompensation: string | null;
  buyerSideCompensation: string | null;
  compensationPayer: string | null;
  compensationPayees: string | null;
  compensationPayoutTrigger: string | null;
  compensationPaymentMethod: string | null;
  compensationAuthorizationStatus: string | null;
  compensationConfidentialityNote: string | null;
};

type DossierApprovalRequirement = {
  id: string;
  transitionKey: string;
  requiredRole: string;
  requiredCount: number;
  status: string;
};

type DossierSourceIntake = {
  id: string;
  reference: string;
  referralCode: string | null;
  referredByName: string | null;
  referredByCompany: string | null;
  submitterName: string;
  submitterEmail: string;
  promotedAt: string | null;
  promotedBy: string | null;
};

type DossierSourceOpportunity = {
  id: string;
  title: string;
  source: string;
  status: string;
  sourceIntake: DossierSourceIntake | null;
};

type DossierAvailableTransition = {
  transitionKey: string;
  fromState: string;
  toState: string;
  label: string;
  profile: string;
  profileLabel: string;
  recommended: boolean;
  reason: string;
};

type DossierWorkspace = {
  id: string;
  reference: string;
  title: string;
  state: string;

  commodity: string | null;
  origin: string | null;
  quantityKg: string | null;
  refinery: string | null;
  settlement: string | null;
  terms: DossierTerms | null;

  nextStates: string[];
  executionProfile: string;
  executionProfileLabel: string;
  availableTransitions: DossierAvailableTransition[];

  transitionCount: number;
  executedInstrumentCount: number;
  pendingApprovalCount: number;

  sourceOpportunities: DossierSourceOpportunity[];

  parties: DossierParty[];
  instruments: DossierInstrument[];
  approvalRequirements: DossierApprovalRequirement[];
  events: DossierEvent[];
};

type DossierWorkspaceResponse = {
  ok: boolean;
  dossier?: DossierWorkspace;
  error?: string;
};

type Props = {
  dossierId: string | null;
};

function formatTime(value?: string) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

type ReviewState = "COMPLETE" | "PARTIAL" | "SEEDED" | "NEEDS_REVIEW";

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function isSeededPartyRecord(party: DossierParty) {
  const notes = party.notes?.trim().toLowerCase() ?? "";

  return (
    notes.startsWith("seeded from") ||
    notes.includes("seeded from source intake") ||
    notes.includes("seeded from promoted opportunity")
  );
}

function hasOperatorConfirmationNote(value: string | null | undefined) {
  const note = value?.trim().toLowerCase() ?? "";

  return (
    note.includes("operator confirmed") ||
    note.includes("authority confirmed") ||
    note.includes("kyc confirmed") ||
    note.includes("terms confirmed") ||
    note.includes("settlement confirmed") ||
    note.includes("review complete") ||
    note.includes("party confirmed")
  );
}

function getPartyReviewState(party: DossierParty): ReviewState {
  const hasLegalName = hasText(party.legalName);
  const hasRepresentative = hasText(party.representative);
  const hasCountry = hasText(party.country);
  const hasNotes = hasText(party.notes);

  if (!hasLegalName) {
    return "NEEDS_REVIEW";
  }

  if (isSeededPartyRecord(party) && !hasOperatorConfirmationNote(party.notes)) {
    return "SEEDED";
  }

  if (hasLegalName && hasRepresentative && hasCountry) {
    return "COMPLETE";
  }

  if (hasLegalName && (hasRepresentative || hasCountry || hasNotes)) {
    return "PARTIAL";
  }

  return "SEEDED";
}

function getPartyReadiness(parties: DossierParty[]) {
  return parties.reduce(
    (summary, party) => {
      const state = getPartyReviewState(party);

      if (state === "COMPLETE") {
        summary.complete += 1;
      } else if (state === "PARTIAL") {
        summary.partial += 1;
      } else if (state === "SEEDED") {
        summary.seeded += 1;
      } else {
        summary.needsReview += 1;
      }

      return summary;
    },
    {
      complete: 0,
      partial: 0,
      seeded: 0,
      needsReview: 0,
    },
  );
}

function getDocumentReadiness(instruments: DossierInstrument[]) {
  const requiredDocuments = getRequiredDossierDocuments();

  return requiredDocuments.reduce(
    (summary, document) => {
      const instrument = document.instrumentType
        ? instruments.find((item) => item.type === document.instrumentType)
        : null;

      if (
        instrument?.status === "EXECUTED" ||
        instrument?.status === "ACTIVE"
      ) {
        summary.ready += 1;
      } else if (instrument?.status === "DRAFT") {
        summary.draft += 1;
      } else {
        summary.pending += 1;
      }

      return summary;
    },
    {
      ready: 0,
      draft: 0,
      pending: 0,
      total: requiredDocuments.length,
    },
  );
}

function hasSeededTermsNote(terms: DossierTerms | null) {
  const note =
    terms?.compensationConfidentialityNote?.trim().toLowerCase() ?? "";

  return (
    note.startsWith("seeded from") ||
    note.includes("seeded from source intake") ||
    note.includes("seeded from promoted opportunity") ||
    note.includes("seeded from source intake for operator review")
  );
}

function hasOperatorTermsConfirmation(terms: DossierTerms | null) {
  return hasOperatorConfirmationNote(terms?.compensationConfidentialityNote);
}

function getSettlementTermsReviewState(
  terms: DossierTerms | null,
): ReviewState {
  const hasSettlementMethod = hasText(terms?.settlementMethod);
  const hasBeneficiary = hasText(terms?.beneficiary);
  const hasPaymentTrigger = hasText(terms?.paymentTrigger);

  if (!hasSettlementMethod) {
    return "NEEDS_REVIEW";
  }

  if (hasSeededTermsNote(terms) && !hasOperatorTermsConfirmation(terms)) {
    return "SEEDED";
  }

  if (hasSettlementMethod && hasBeneficiary && hasPaymentTrigger) {
    return "COMPLETE";
  }

  return "PARTIAL";
}

function getFinancialInstrumentTermsReviewState(
  terms: DossierTerms | null,
): ReviewState {
  const hasType = hasText(terms?.financialInstrumentType);
  const hasInstitution = hasText(terms?.issuingInstitution);
  const hasCoverage = hasText(terms?.instrumentAmountOrCoverage);
  const hasValidity = hasText(terms?.validityPeriod);

  if (!hasType) {
    return "NEEDS_REVIEW";
  }

  if (hasSeededTermsNote(terms) && !hasOperatorTermsConfirmation(terms)) {
    return "SEEDED";
  }

  if (hasType && hasInstitution && hasCoverage && hasValidity) {
    return "COMPLETE";
  }

  return "PARTIAL";
}

function getCompensationTermsReviewState(
  terms: DossierTerms | null,
): ReviewState {
  const hasPayer = hasText(terms?.compensationPayer);
  const hasPayees = hasText(terms?.compensationPayees);
  const hasTrigger = hasText(terms?.compensationPayoutTrigger);
  const hasAuthorization = hasText(terms?.compensationAuthorizationStatus);
  const hasAnyCompensation =
    hasText(terms?.sellerSideCompensation) ||
    hasText(terms?.buyerSideCompensation) ||
    hasText(terms?.compensationPaymentMethod) ||
    hasText(terms?.compensationConfidentialityNote) ||
    hasPayer ||
    hasPayees ||
    hasTrigger ||
    hasAuthorization;

  if (!hasAnyCompensation) {
    return "NEEDS_REVIEW";
  }

  if (
    hasSeededTermsNote(terms) &&
    !hasOperatorTermsConfirmation(terms) &&
    !hasPayer &&
    !hasPayees &&
    !hasTrigger
  ) {
    return "SEEDED";
  }

  if (hasPayer && hasPayees && hasTrigger && hasAuthorization) {
    return "COMPLETE";
  }

  return "PARTIAL";
}

function formatReviewState(state: ReviewState) {
  return state.replace("_", " ");
}

function getTermsReviewSnapshot(terms: DossierTerms | null) {
  return {
    settlement: getSettlementTermsReviewState(terms),
    instrument: getFinancialInstrumentTermsReviewState(terms),
    compensation: getCompensationTermsReviewState(terms),
  };
}

function findPartyByRole(parties: DossierParty[], role: string) {
  return parties.find((party) => party.role === role) ?? null;
}

function getDossierDataReadiness(dossier: DossierWorkspace) {
  const requiredDocuments = getRequiredDossierDocuments();
  const buyer = findPartyByRole(dossier.parties, "BUYER");
  const seller = findPartyByRole(dossier.parties, "SELLER");
  const terms = dossier.terms;

  function fieldPresent(label: string, present: boolean) {
    return {
      label,
      present,
    };
  }

  return requiredDocuments.reduce(
    (summary, document) => {
      const requirements = [];

      switch (document.instrumentType ?? document.key) {
        case "SPA":
          requirements.push(
            fieldPresent("Buyer Party", hasText(buyer?.legalName)),
            fieldPresent("Seller Party", hasText(seller?.legalName)),
            fieldPresent("Commodity", hasText(dossier.commodity)),
            fieldPresent("Quantity", hasText(dossier.quantityKg)),
            fieldPresent(
              "Settlement Method",
              hasText(terms?.settlementMethod) || hasText(dossier.settlement),
            ),
          );
          break;

        case "ANNEX_B_SETTLEMENT":
        case "BUYER_BANKING":
        case "SELLER_BANKING": {
          const settlementReview = getSettlementTermsReviewState(terms);

          requirements.push(
            fieldPresent(
              "Settlement Method",
              hasText(terms?.settlementMethod) || hasText(dossier.settlement),
            ),
            fieldPresent(
              "Beneficiary / Receiving Party",
              hasText(terms?.beneficiary),
            ),
            fieldPresent("Payment Trigger", hasText(terms?.paymentTrigger)),
            fieldPresent("Settlement Review", settlementReview === "COMPLETE"),
          );
          break;
        }

        case "ANNEX_F_FINANCIAL_INSTRUMENT": {
          const instrumentReview =
            getFinancialInstrumentTermsReviewState(terms);

          requirements.push(
            fieldPresent(
              "Financial Instrument Type",
              hasText(terms?.financialInstrumentType),
            ),
            fieldPresent(
              "Issuing / Escrow Institution",
              hasText(terms?.issuingInstitution),
            ),
            fieldPresent(
              "Instrument Coverage",
              hasText(terms?.instrumentAmountOrCoverage),
            ),
            fieldPresent("Validity / Tenor", hasText(terms?.validityPeriod)),
            fieldPresent(
              "Financial Instrument Review",
              instrumentReview === "COMPLETE",
            ),
          );
          break;
        }

        case "ANNEX_G_COMPENSATION_SCHEDULE": {
          const compensationReview = getCompensationTermsReviewState(terms);

          requirements.push(
            fieldPresent(
              "Compensation Payer",
              hasText(terms?.compensationPayer),
            ),
            fieldPresent(
              "Compensation Payees",
              hasText(terms?.compensationPayees),
            ),
            fieldPresent(
              "Payout Trigger",
              hasText(terms?.compensationPayoutTrigger),
            ),
            fieldPresent(
              "Authorization Status",
              hasText(terms?.compensationAuthorizationStatus),
            ),
            fieldPresent(
              "Compensation Review",
              compensationReview === "COMPLETE",
            ),
          );
          break;
        }

        case "ANNEX_C_REFINERY":
          requirements.push(
            fieldPresent("Refinery", hasText(dossier.refinery)),
            fieldPresent("Commodity", hasText(dossier.commodity)),
            fieldPresent("Quantity", hasText(dossier.quantityKg)),
          );
          break;

        case "ANNEX_D_COMPLIANCE":
        case "SELLER_KYC":
          requirements.push(
            fieldPresent("Buyer Identity", hasText(buyer?.legalName)),
            fieldPresent(
              "Buyer Review Context",
              getPartyReviewState(
                buyer ?? {
                  id: "",
                  role: "BUYER",
                  legalName: "",
                  representative: null,
                  country: null,
                  notes: null,
                },
              ) !== "NEEDS_REVIEW",
            ),
            fieldPresent("Seller Identity", hasText(seller?.legalName)),
            fieldPresent(
              "Seller Review Context",
              getPartyReviewState(
                seller ?? {
                  id: "",
                  role: "SELLER",
                  legalName: "",
                  representative: null,
                  country: null,
                  notes: null,
                },
              ) !== "NEEDS_REVIEW",
            ),
          );
          break;

        case "BUYER_CIS":
        case "BUYER_AUTHORIZATION":
        case "BUYER_ID":
          requirements.push(
            fieldPresent("Buyer Identity", hasText(buyer?.legalName)),
            fieldPresent(
              "Buyer Review Context",
              getPartyReviewState(
                buyer ?? {
                  id: "",
                  role: "BUYER",
                  legalName: "",
                  representative: null,
                  country: null,
                  notes: null,
                },
              ) !== "NEEDS_REVIEW",
            ),
          );
          break;

        case "BUYER_POF":
          requirements.push(
            fieldPresent("Buyer Identity", hasText(buyer?.legalName)),
            fieldPresent("Settlement Method", hasText(terms?.settlementMethod)),
          );
          break;

        case "ANNEX_A_DELIVERY":
        case "ANNEX_E_PROCEDURE":
          requirements.push(
            fieldPresent("Buyer Party", hasText(buyer?.legalName)),
            fieldPresent("Seller Party", hasText(seller?.legalName)),
            fieldPresent("Commodity", hasText(dossier.commodity)),
            fieldPresent(
              "Settlement Method",
              hasText(terms?.settlementMethod) || hasText(dossier.settlement),
            ),
          );
          break;

        case "PRODUCT_EVIDENCE":
          requirements.push(
            fieldPresent("Commodity", hasText(dossier.commodity)),
            fieldPresent("Origin", hasText(dossier.origin)),
          );
          break;

        case "EXPORT_RELEASE_NOTICE":
        case "EXPORT_ACTIVATION_NOTICE":
          requirements.push(
            fieldPresent("Release Conditions", false),
            fieldPresent("Settlement Method", hasText(terms?.settlementMethod)),
          );
          break;

        default:
          requirements.push(fieldPresent("Operator Review", false));
          break;
      }

      const present = requirements.filter((item) => item.present).length;
      const missing = requirements.length - present;

      if (missing === 0) {
        summary.ready += 1;
      } else if (present > 0) {
        summary.draftable += 1;
      } else {
        summary.blocked += 1;
      }

      return summary;
    },
    {
      ready: 0,
      draftable: 0,
      blocked: 0,
      total: requiredDocuments.length,
    },
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "cyan" | "amber" | "emerald" | "red";
}) {
  const toneClass = {
    neutral: "border-neutral-800 bg-black/30 text-neutral-300",
    cyan: "border-cyan-900 bg-cyan-950/20 text-cyan-300",
    amber: "border-amber-900 bg-amber-950/20 text-amber-300",
    emerald: "border-emerald-900 bg-emerald-950/20 text-emerald-300",
    red: "border-red-900 bg-red-950/20 text-red-300",
  }[tone];

  return (
    <div className={`rounded border p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-white">{value}</div>

      <p className="mt-1 text-[11px] leading-relaxed opacity-75">{detail}</p>
    </div>
  );
}

function DossierBriefSummary({ dossier }: { dossier: DossierWorkspace }) {
  const sourceIntake =
    dossier.sourceOpportunities[0]?.sourceIntake?.reference ??
    "Direct / Manual";
  const partyReadiness = getPartyReadiness(dossier.parties);
  const dataReadiness = getDossierDataReadiness(dossier);
  const termsSnapshot = getTermsReviewSnapshot(dossier.terms);

  const partyValue = `${partyReadiness.complete} complete · ${partyReadiness.seeded} seeded`;
  const termsValue = `${formatReviewState(termsSnapshot.settlement)} settlement`;
  const draftsValue = `${dataReadiness.ready} ready · ${dataReadiness.draftable} draftable`;

  return (
    <section className="rounded-xl border border-cyan-900/50 bg-cyan-950/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            Dossier Front Page
          </div>

          <h3 className="mt-1 text-sm font-semibold text-white">
            Read this before acting
          </h3>

          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-neutral-500">
            This is the compressed operator view: origin, party maturity,
            commercial terms, drafting posture, and issuance caution before any
            execution or external release.
          </p>
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
          {dossier.state}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Origin"
          value={sourceIntake}
          detail="Source trace for the dossier record."
          tone={sourceIntake === "Direct / Manual" ? "neutral" : "cyan"}
        />

        <SummaryCard
          label="Profile"
          value={dossier.executionProfileLabel}
          detail="Execution lane inferred from settlement, transaction, and terms."
          tone={dossier.executionProfile === "MANUAL_REVIEW" ? "amber" : "cyan"}
        />

        <SummaryCard
          label="Parties"
          value={partyValue}
          detail={`${partyReadiness.partial} partial · ${partyReadiness.needsReview} needs review`}
          tone={
            partyReadiness.needsReview > 0
              ? "red"
              : partyReadiness.seeded > 0
                ? "cyan"
                : "emerald"
          }
        />

        <SummaryCard
          label="Terms"
          value={termsValue}
          detail={`Instrument: ${formatReviewState(
            termsSnapshot.instrument,
          )} · Compensation: ${formatReviewState(termsSnapshot.compensation)}`}
          tone={
            termsSnapshot.settlement === "NEEDS_REVIEW"
              ? "red"
              : termsSnapshot.settlement === "SEEDED"
                ? "cyan"
                : termsSnapshot.settlement === "COMPLETE"
                  ? "emerald"
                  : "amber"
          }
        />

        <SummaryCard
          label="Drafts"
          value={draftsValue}
          detail={`${dataReadiness.blocked} blocked · ${dataReadiness.total} required`}
          tone={
            dataReadiness.blocked > 0
              ? "red"
              : dataReadiness.draftable > 0
                ? "amber"
                : "emerald"
          }
        />

        <SummaryCard
          label="Issuance"
          value={
            dossier.pendingApprovalCount > 0
              ? "Approval Pending"
              : "Internal Review"
          }
          detail="External release must pass operator approval."
          tone={dossier.pendingApprovalCount > 0 ? "amber" : "neutral"}
        />
      </div>
    </section>
  );
}

export default function DossierWorkspacePanel({ dossierId }: Props) {
  const [dossier, setDossier] = useState<DossierWorkspace | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<DossierWorkspaceTab>("OVERVIEW");

  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (!dossierId) {
      setDossier(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDossierWorkspace() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/control-center/dossiers/${dossierId}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );

        const result = (await response.json()) as DossierWorkspaceResponse;

        if (cancelled) return;

        if (!response.ok || !result.ok) {
          setDossier(null);
          setError(result.error ?? "DOSSIER_WORKSPACE_LOAD_FAILED");
          return;
        }

        setDossier(result.dossier ?? null);
      } catch (err) {
        console.error("[DOSSIER_WORKSPACE_FAILED]", err);

        if (!cancelled) {
          setDossier(null);
          setError("DOSSIER_WORKSPACE_LOAD_FAILED");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDossierWorkspace();

    return () => {
      cancelled = true;
    };
  }, [dossierId, refreshNonce]);

  if (!dossierId) {
    return null;
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      {loading ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-3 text-xs text-neutral-500">
          Loading dossier workspace...
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {!loading && !error && !dossier ? (
        <div className="rounded border border-neutral-800 bg-black/30 p-3 text-xs text-neutral-500">
          Dossier workspace unavailable.
        </div>
      ) : null}

      {dossier ? (
        <div className="space-y-3">
          <DossierWorkspaceHeader
            reference={dossier.reference}
            title={dossier.title}
            state={dossier.state}
            sourceOpportunity={dossier.sourceOpportunities[0] ?? null}
          />

          <DossierMissionPanel
            commodity={dossier.commodity}
            quantityKg={dossier.quantityKg}
            origin={dossier.origin}
            settlement={dossier.settlement}
            currentState={dossier.state}
            nextStates={dossier.nextStates}
            sourceOpportunity={dossier.sourceOpportunities[0] ?? null}
          />

          <OperatorPathStrip activeTab={activeTab} onSelectTab={setActiveTab} />

          {activeTab === "OVERVIEW" ? (
            <div className="space-y-3">
              <DossierBriefSummary dossier={dossier} />

              <DossierOverviewCard
                commodity={dossier.commodity}
                quantityKg={dossier.quantityKg}
                origin={dossier.origin}
                refinery={dossier.refinery}
                settlement={dossier.settlement}
                parties={dossier.parties}
              />

              <DossierPartyCompletionPanel
                parties={dossier.parties}
                onPartyChanged={() => setRefreshNonce((value) => value + 1)}
              />
            </div>
          ) : null}

          {activeTab === "EXECUTION" ? (
            <div className="space-y-3">
              <DossierCommandPanel
                currentState={dossier.state}
                nextStates={dossier.nextStates}
                pendingApprovalCount={dossier.pendingApprovalCount}
                executedInstrumentCount={dossier.executedInstrumentCount}
                partyReadiness={getPartyReadiness(dossier.parties)}
                documentReadiness={getDocumentReadiness(dossier.instruments)}
                onSelectExecution={() => setActiveTab("EXECUTION")}
                onSelectDocuments={() => setActiveTab("DOCUMENTS")}
                onSelectTimeline={() => setActiveTab("TIMELINE")}
              />

              <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Profile-Aware Next Moves
                    </div>

                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                      Available transitions are filtered by the dossier
                      execution profile, so non-escrow deals are not pushed into
                      the escrow lane.
                    </p>
                  </div>

                  <div className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
                    {dossier.executionProfileLabel}
                  </div>
                </div>

                {dossier.availableTransitions.length === 0 ? (
                  <div className="mt-3 rounded border border-amber-900 bg-amber-950/20 p-2 text-xs text-amber-300">
                    No profile-aware next moves are currently available.
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {dossier.availableTransitions.map((transition) => (
                      <div
                        key={transition.transitionKey}
                        className="rounded border border-neutral-800 bg-black/30 p-2 text-xs"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-white">
                              {transition.label}
                            </div>

                            <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                              {transition.fromState} → {transition.toState}
                            </div>
                          </div>

                          <div
                            className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
                              transition.recommended
                                ? "border-emerald-900 bg-emerald-950/20 text-emerald-300"
                                : "border-neutral-800 bg-black/30 text-neutral-400"
                            }`}
                          >
                            {transition.recommended
                              ? "Recommended"
                              : "Available"}
                          </div>
                        </div>

                        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                          {transition.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DossierExecutionCard
                currentState={dossier.state}
                nextStates={dossier.nextStates}
                transitionCount={dossier.transitionCount}
                executedInstrumentCount={dossier.executedInstrumentCount}
                pendingApprovalCount={dossier.pendingApprovalCount}
                partyReadiness={getPartyReadiness(dossier.parties)}
                documentReadiness={getDocumentReadiness(dossier.instruments)}
              />

              <TransitionActionBar
                dossierId={dossier.id}
                nextStates={dossier.nextStates}
                onTransitioned={async () => {
                  setRefreshNonce((value) => value + 1);
                }}
              />

              <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    Approval Gates
                  </div>

                  <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
                    {dossier.approvalRequirements.length} Requirements
                  </div>
                </div>

                {dossier.approvalRequirements.length === 0 ? (
                  <div className="mt-3 text-xs text-neutral-500">
                    No approval gates attached.
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {dossier.approvalRequirements.map((requirement) => (
                      <div
                        key={requirement.id}
                        className="rounded border border-neutral-800 bg-black/30 p-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-white">
                              {requirement.transitionKey}
                            </div>

                            <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                              {requirement.requiredRole} · Required:{" "}
                              {requirement.requiredCount}
                            </div>
                          </div>

                          <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
                            {requirement.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === "TIMELINE" ? (
            <DossierTimelinePanel
              currentState={dossier.state}
              events={dossier.events}
            />
          ) : null}

          {activeTab === "DOCUMENTS" ? (
            <div className="space-y-3">
              <DossierTermsPanel
                dossierId={dossier.id}
                onTermsChanged={() => setRefreshNonce((value) => value + 1)}
              />

              <DossierBankCoordinatesPanel
                dossierId={dossier.id}
                onCoordinatesChanged={() =>
                  setRefreshNonce((value) => value + 1)
                }
              />

              <DossierReleaseConditionsPanel
                dossierId={dossier.id}
                onReleaseConditionsChanged={() =>
                  setRefreshNonce((value) => value + 1)
                }
              />

              <DossierIssuanceApprovalPanel
                dossierId={dossier.id}
                instruments={dossier.instruments}
                onApprovalChanged={() => setRefreshNonce((value) => value + 1)}
              />

              <DossierDocumentsPanel
                key={`documents-${dossier.id}-${refreshNonce}`}
                dossierId={dossier.id}
                dossier={{
                  commodity: dossier.commodity,
                  origin: dossier.origin,
                  quantityKg: dossier.quantityKg,
                  refinery: dossier.refinery,
                  settlement: dossier.settlement,
                }}
                parties={dossier.parties}
                terms={dossier.terms}
                instruments={dossier.instruments}
                onInstrumentChanged={() =>
                  setRefreshNonce((value) => value + 1)
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
