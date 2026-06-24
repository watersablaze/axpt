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

function getPartyReadiness(parties: DossierParty[]) {
  return parties.reduce(
    (summary, party) => {
      if (party.legalName && party.country && party.representative) {
        summary.complete += 1;
      } else if (party.legalName && (party.country || party.representative)) {
        summary.partial += 1;
      } else if (party.legalName) {
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

function getTermsSnapshot(terms: DossierTerms | null) {
  return {
    settlement: terms?.settlementMethod ? "Present" : "Needs Review",
    instrument: terms?.financialInstrumentType ? "Present" : "Needs Review",
    compensation:
      terms?.compensationPayer ||
      terms?.compensationPayees ||
      terms?.compensationConfidentialityNote
        ? "Present"
        : "Needs Review",
  };
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
  const documentReadiness = getDocumentReadiness(dossier.instruments);
  const termsSnapshot = getTermsSnapshot(dossier.terms);

  const partyValue = `${partyReadiness.complete} complete · ${partyReadiness.seeded} seeded`;
  const termsValue = `${termsSnapshot.settlement} settlement`;
  const draftsValue = `${documentReadiness.ready} ready · ${documentReadiness.pending} pending`;

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

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Origin"
          value={sourceIntake}
          detail="Source trace for the dossier record."
          tone={sourceIntake === "Direct / Manual" ? "neutral" : "cyan"}
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
          detail={`Instrument: ${termsSnapshot.instrument} · Compensation: ${termsSnapshot.compensation}`}
          tone={termsSnapshot.settlement === "Needs Review" ? "red" : "amber"}
        />

        <SummaryCard
          label="Drafts"
          value={draftsValue}
          detail={`${documentReadiness.draft} draft · ${documentReadiness.total} required`}
          tone={documentReadiness.pending > 0 ? "amber" : "emerald"}
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
