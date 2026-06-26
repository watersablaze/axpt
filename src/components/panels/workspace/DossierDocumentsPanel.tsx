"use client";

import { useState } from "react";

import {
  DOSSIER_DOCUMENT_GROUPS,
  type RequiredDossierDocument,
} from "@/domains/control-center/dossiers/documentRequirements";

type DossierParty = {
  id: string;
  role: string;
  legalName: string;
  representative: string | null;
  country: string | null;
  notes: string | null;
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

type DossierDependencyContext = {
  commodity: string | null;
  origin: string | null;
  quantityKg: string | null;
  refinery: string | null;
  settlement: string | null;
  executionProfile?: string | null;
  executionProfileLabel?: string | null;
};

type DependencyIssue = {
  label: string;
  present: boolean;
};

type DocumentDependencyReadiness = {
  label: "Ready" | "Draftable" | "Blocked" | "Pending";
  tone: string;
  present: DependencyIssue[];
  missing: DependencyIssue[];
};

type Instrument = {
  id: string;
  type: string;
  status: string;
  version: string;
  title: string;
};

type TemplateIssue = {
  field: string;
  label: string;
  status: "PRESENT" | "MISSING" | "WARNING";
  detail: string;
};

type RenderPreview = {
  instrumentType: string;
  title: string;
  renderedText: string;
  missingFields: TemplateIssue[];
  warnings: TemplateIssue[];
};

type Props = {
  dossierId: string;
  dossier: DossierDependencyContext;
  parties: DossierParty[];
  terms: DossierTerms | null;
  instruments: Instrument[];
  onInstrumentChanged?: () => void;
};

type DocumentFilter = "ROUTE" | "CORE" | "ALL";

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function findParty(parties: DossierParty[], role: string) {
  return parties.find((party) => party.role === role) ?? null;
}

function partyHasIdentity(party: DossierParty | null) {
  return Boolean(party?.legalName?.trim());
}

function partyHasReviewContext(party: DossierParty | null) {
  return Boolean(
    party?.country?.trim() ||
      party?.representative?.trim() ||
      party?.notes?.trim(),
  );
}

function buildDependencyReadiness({
  document,
  dossier,
  parties,
  terms,
}: {
  document: RequiredDossierDocument;
  dossier: DossierDependencyContext;
  parties: DossierParty[];
  terms: DossierTerms | null;
}): DocumentDependencyReadiness {
  const buyer = findParty(parties, "BUYER");
  const seller = findParty(parties, "SELLER");

  const requirements: DependencyIssue[] = [];

  function requireField(label: string, present: boolean) {
    requirements.push({
      label,
      present,
    });
  }

  switch (document.instrumentType ?? document.key) {
    case "SPA":
      requireField("Buyer Party", partyHasIdentity(buyer));
      requireField("Seller Party", partyHasIdentity(seller));
      requireField("Commodity", hasValue(dossier.commodity));
      requireField("Quantity", hasValue(dossier.quantityKg));
      requireField("Origin", hasValue(dossier.origin));
      requireField(
        "Settlement Method",
        hasValue(terms?.settlementMethod) || hasValue(dossier.settlement),
      );
      break;

    case "ANNEX_A_DELIVERY":
      requireField("Commodity", hasValue(dossier.commodity));
      requireField("Quantity", hasValue(dossier.quantityKg));
      requireField("Origin", hasValue(dossier.origin));
      requireField("Buyer Party", partyHasIdentity(buyer));
      requireField("Seller Party", partyHasIdentity(seller));
      break;

    case "ANNEX_B_SETTLEMENT":
    case "BUYER_BANKING":
    case "SELLER_BANKING":
      requireField(
        "Settlement Method",
        hasValue(terms?.settlementMethod) || hasValue(dossier.settlement),
      );
      requireField(
        "Beneficiary / Receiving Party",
        hasValue(terms?.beneficiary),
      );
      requireField("Payment Trigger", hasValue(terms?.paymentTrigger));
      break;

    case "ANNEX_C_REFINERY":
      requireField("Refinery", hasValue(dossier.refinery));
      requireField("Commodity", hasValue(dossier.commodity));
      requireField("Quantity", hasValue(dossier.quantityKg));
      break;

    case "ANNEX_D_COMPLIANCE":
    case "SELLER_KYC":
      requireField("Buyer Identity", partyHasIdentity(buyer));
      requireField("Buyer Review Context", partyHasReviewContext(buyer));
      requireField("Seller Identity", partyHasIdentity(seller));
      requireField("Seller Review Context", partyHasReviewContext(seller));
      break;

    case "ANNEX_E_PROCEDURE":
      requireField("Buyer Party", partyHasIdentity(buyer));
      requireField("Seller Party", partyHasIdentity(seller));
      requireField("Commodity", hasValue(dossier.commodity));
      requireField(
        "Settlement Method",
        hasValue(terms?.settlementMethod) || hasValue(dossier.settlement),
      );
      break;

    case "ANNEX_F_FINANCIAL_INSTRUMENT":
      requireField(
        "Financial Instrument Type",
        hasValue(terms?.financialInstrumentType),
      );
      requireField(
        "Issuing / Escrow Institution",
        hasValue(terms?.issuingInstitution),
      );
      requireField(
        "Instrument Coverage",
        hasValue(terms?.instrumentAmountOrCoverage),
      );
      requireField("Validity / Tenor", hasValue(terms?.validityPeriod));
      break;

    case "ANNEX_G_COMPENSATION_SCHEDULE":
      requireField("Compensation Payer", hasValue(terms?.compensationPayer));
      requireField("Compensation Payees", hasValue(terms?.compensationPayees));
      requireField(
        "Payout Trigger",
        hasValue(terms?.compensationPayoutTrigger),
      );
      requireField(
        "Authorization Status",
        hasValue(terms?.compensationAuthorizationStatus),
      );
      break;

    case "BUYER_CIS":
    case "BUYER_AUTHORIZATION":
    case "BUYER_ID":
      requireField("Buyer Identity", partyHasIdentity(buyer));
      requireField("Buyer Review Context", partyHasReviewContext(buyer));
      break;

    case "BUYER_POF":
      requireField("Buyer Identity", partyHasIdentity(buyer));
      requireField("Settlement Method", hasValue(terms?.settlementMethod));
      break;

    case "PRODUCT_EVIDENCE":
      requireField("Commodity", hasValue(dossier.commodity));
      requireField("Origin", hasValue(dossier.origin));
      break;

    case "EXPORT_RELEASE_NOTICE":
    case "EXPORT_ACTIVATION_NOTICE":
      requireField("Release Conditions", false);
      requireField("Settlement Method", hasValue(terms?.settlementMethod));
      break;

    default:
      requireField("Operator Review", false);
      break;
  }

  const missing = requirements.filter((item) => !item.present);
  const present = requirements.filter((item) => item.present);

  if (requirements.length === 0) {
    return {
      label: "Pending",
      tone: "border-neutral-800 bg-black/30 text-neutral-400",
      present,
      missing,
    };
  }

  if (missing.length === 0) {
    return {
      label: "Ready",
      tone: "border-emerald-900 bg-emerald-950/20 text-emerald-300",
      present,
      missing,
    };
  }

  if (present.length > 0) {
    return {
      label: "Draftable",
      tone: "border-amber-900 bg-amber-950/20 text-amber-300",
      present,
      missing,
    };
  }

  return {
    label: "Blocked",
    tone: "border-red-900 bg-red-950/20 text-red-300",
    present,
    missing,
  };
}

function DependencyReadinessPanel({
  readiness,
}: {
  readiness: DocumentDependencyReadiness;
}) {
  return (
    <div className="mt-3 rounded border border-neutral-800 bg-black/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Data Readiness
          </div>

          <div className="mt-1 text-[11px] text-neutral-500">
            {readiness.present.length} present · {readiness.missing.length}{" "}
            missing
          </div>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${readiness.tone}`}
        >
          {readiness.label}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded border border-emerald-900/50 bg-emerald-950/10 p-2">
          <div className="text-[10px] uppercase tracking-wide text-emerald-400/70">
            Present
          </div>

          {readiness.present.length === 0 ? (
            <div className="mt-2 text-[11px] text-emerald-300/60">None</div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1">
              {readiness.present.map((item: DependencyIssue) => (
                <span
                  key={item.label}
                  className="rounded border border-emerald-900 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300"
                >
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded border border-red-900/50 bg-red-950/10 p-2">
          <div className="text-[10px] uppercase tracking-wide text-red-400/70">
            Missing
          </div>

          {readiness.missing.length === 0 ? (
            <div className="mt-2 text-[11px] text-red-300/60">None</div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1">
              {readiness.missing.map((item: DependencyIssue) => (
                <span
                  key={item.label}
                  className="rounded border border-red-900 px-2 py-1 text-[10px] uppercase tracking-wide text-red-300"
                >
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function statusTone(status: string) {
  switch (status) {
    case "EXECUTED":
      return "border-emerald-900 bg-emerald-950/20 text-emerald-300";

    case "ACTIVE":
      return "border-cyan-900 bg-cyan-950/20 text-cyan-300";

    case "DRAFT":
      return "border-amber-900 bg-amber-950/20 text-amber-300";

    case "TEMPLATE":
      return "border-neutral-700 bg-black/30 text-neutral-300";

    case "SUPERSEDED":
    case "ARCHIVED":
      return "border-neutral-800 bg-black/30 text-neutral-500";

    case "PENDING":
    default:
      return "border-red-900 bg-red-950/20 text-red-300";
  }
}

function issueTone(status: TemplateIssue["status"]) {
  switch (status) {
    case "MISSING":
      return "border-red-900 bg-red-950/20 text-red-300";

    case "WARNING":
      return "border-amber-900 bg-amber-950/20 text-amber-300";

    case "PRESENT":
    default:
      return "border-emerald-900 bg-emerald-950/20 text-emerald-300";
  }
}

const ROUTE_KITS: Record<
  string,
  {
    label: string;
    description: string;
    instrumentTypes: string[];
  }
> = {
  ESCROW_SETTLEMENT: {
    label: "Escrow Settlement",
    description:
      "Escrow setup, coordinates, settlement annex posture, and funding confirmation after SPA execution.",
    instrumentTypes: ["ESCROW_SETUP_INSTRUCTION", "PAYMENT_CONFIRMATION"],
  },
  DIRECT_WIRE: {
    label: "Direct Wire / MT103",
    description: "Payment instructions and bank/wire confirmation evidence.",
    instrumentTypes: ["PAYMENT_INSTRUCTION_SHEET", "PAYMENT_CONFIRMATION"],
  },
  CASH_AND_CARRY: {
    label: "Cash & Carry",
    description:
      "Payment instructions and receiving-party confirmation evidence.",
    instrumentTypes: ["PAYMENT_INSTRUCTION_SHEET", "PAYMENT_CONFIRMATION"],
  },
  HAND_CARRY_EXPORT: {
    label: "Hand-Carry Export",
    description:
      "Payment instructions, receiving-party confirmation, and hand-carry execution posture.",
    instrumentTypes: ["PAYMENT_INSTRUCTION_SHEET", "PAYMENT_CONFIRMATION"],
  },
  CRYPTO_SETTLEMENT: {
    label: "Crypto Settlement",
    description:
      "Wallet, network, stablecoin/token, and on-chain receipt confirmation.",
    instrumentTypes: [
      "CRYPTO_SETTLEMENT_INSTRUCTION",
      "WALLET_CONFIRMATION_SHEET",
      "CRYPTO_RECEIPT_EVIDENCE",
    ],
  },
  DLC_OR_SBLC: {
    label: "DLC / SBLC",
    description:
      "Financial instrument review and instrument evidence confirmation.",
    instrumentTypes: [
      "FINANCIAL_INSTRUMENT_REVIEW_SHEET",
      "FINANCIAL_INSTRUMENT_EVIDENCE",
    ],
  },
  REFINERY_SETTLEMENT: {
    label: "Refinery Settlement",
    description: "Refinery coordination, procedure, intake, and assay posture.",
    instrumentTypes: ["REFINERY_COORDINATION_SHEET"],
  },
  MANUAL_REVIEW: {
    label: "Manual Review",
    description:
      "Execution lane has not been confidently inferred. Operator review is required.",
    instrumentTypes: [],
  },
};

function getRouteKit(profile: string | null | undefined) {
  return ROUTE_KITS[profile ?? ""] ?? ROUTE_KITS.MANUAL_REVIEW;
}

function getRouteDocumentTypes(profile: string | null | undefined) {
  return getRouteKit(profile).instrumentTypes;
}

function isRouteDocument(
  document: RequiredDossierDocument,
  profile: string | null | undefined,
) {
  return Boolean(
    document.instrumentType &&
      getRouteDocumentTypes(profile).includes(document.instrumentType),
  );
}

function isCoreDocumentGroup(title: string) {
  return [
    "Buyer / Representative",
    "Seller / Source",
    "Transaction Package",
    "Financial / Compensation",
  ].includes(title);
}

function getFilteredDocumentGroups({
  filter,
  profile,
}: {
  filter: DocumentFilter;
  profile: string | null | undefined;
}) {
  if (filter === "ALL") {
    return DOSSIER_DOCUMENT_GROUPS;
  }

  if (filter === "CORE") {
    return DOSSIER_DOCUMENT_GROUPS.filter((group) =>
      isCoreDocumentGroup(group.title),
    );
  }

  return DOSSIER_DOCUMENT_GROUPS.map((group) => ({
    ...group,
    documents: group.documents.filter((document) =>
      isRouteDocument(document, profile),
    ),
  })).filter((group) => group.documents.length > 0);
}

function ActiveDocumentTaskPanel({
  dossier,
  instruments,
  updatingInstrumentId,
  onUpdateInstrumentStatus,
}: {
  dossier: DossierDependencyContext;
  instruments: Instrument[];
  updatingInstrumentId: string | null;
  onUpdateInstrumentStatus: ({
    instrument,
    status,
  }: {
    instrument: Instrument;
    status: string;
  }) => void;
}) {
  const spa = instruments.find((instrument) => instrument.type === "SPA");
  const exportReleaseNotice = instruments.find(
    (instrument) => instrument.type === "EXPORT_RELEASE_NOTICE",
  );

  if (
    exportReleaseNotice &&
    !["ACTIVE", "EXECUTED"].includes(exportReleaseNotice.status)
  ) {
    const complete = ["ACTIVE", "EXECUTED"].includes(
      exportReleaseNotice.status,
    );

    return (
      <section
        className={`mt-3 rounded-xl border p-3 ${
          complete
            ? "border-emerald-900/60 bg-emerald-950/10"
            : "border-amber-900/60 bg-amber-950/10"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-amber-400">
              Active Document Task
            </div>

            <h3 className="mt-1 text-sm font-semibold text-white">
              Export activation requires an active Export Release Notice
            </h3>

            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-500">
              The release has been authorized. Activate the Export Release
              Notice before opening EXPORT_ACTIVE.
            </p>
          </div>

          <div
            className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
              complete
                ? "border-emerald-800 text-emerald-300"
                : "border-amber-800 text-amber-300"
            }`}
          >
            EXPORT RELEASE NOTICE {exportReleaseNotice.status}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {!complete ? (
            <button
              type="button"
              disabled={Boolean(updatingInstrumentId)}
              onClick={() =>
                onUpdateInstrumentStatus({
                  instrument: exportReleaseNotice,
                  status: "ACTIVE",
                })
              }
              className="rounded border border-cyan-900 bg-cyan-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
            >
              {updatingInstrumentId === exportReleaseNotice.id
                ? "Activating..."
                : "Activate Export Release Notice"}
            </button>
          ) : (
            <div className="rounded border border-emerald-800 bg-black/20 px-3 py-2 text-xs text-emerald-300">
              Export Release Notice is active.
            </div>
          )}
        </div>
      </section>
    );
  }

  const status = spa?.status ?? "PENDING";
  const complete = status === "EXECUTED";

  return (
    <section
      className={`mt-3 rounded-xl border p-3 ${
        complete
          ? "border-emerald-900/60 bg-emerald-950/10"
          : "border-amber-900/60 bg-amber-950/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-amber-400">
            Active Document Task
          </div>

          <h3 className="mt-1 text-sm font-semibold text-white">
            SPA execution gate requires an executed SPA
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-500">
            Use Core Package to work the SPA record. The SPA must be created,
            activated for review, then marked executed before the dossier can
            advance to SPA_EXECUTED.
          </p>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
            complete
              ? "border-emerald-800 text-emerald-300"
              : "border-amber-800 text-amber-300"
          }`}
        >
          SPA {status}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
        <div
          className={`rounded border p-2 ${
            spa
              ? "border-emerald-900/60 bg-black/20 text-emerald-300"
              : "border-red-900/60 bg-black/20 text-red-300"
          }`}
        >
          1. Create SPA draft
        </div>

        <div
          className={`rounded border p-2 ${
            status === "ACTIVE" || status === "EXECUTED"
              ? "border-emerald-900/60 bg-black/20 text-emerald-300"
              : "border-amber-900/60 bg-black/20 text-amber-300"
          }`}
        >
          2. Activate for review
        </div>

        <div
          className={`rounded border p-2 ${
            complete
              ? "border-emerald-900/60 bg-black/20 text-emerald-300"
              : "border-amber-900/60 bg-black/20 text-amber-300"
          }`}
        >
          3. Mark executed
        </div>
      </div>
    </section>
  );
}

function RouteKitPanel({
  dossier,
  documents,
  instruments,
  creatingType,
  updatingInstrumentId,
  loadingPreviewId,
  previewInstrumentId,
  onCreateDraft,
  onPreviewInstrument,
  onUpdateInstrumentStatus,
}: {
  dossier: DossierDependencyContext;
  documents: RequiredDossierDocument[];
  instruments: Instrument[];
  creatingType: string | null;
  updatingInstrumentId: string | null;
  loadingPreviewId: string | null;
  previewInstrumentId: string | null;
  onCreateDraft: (document: RequiredDossierDocument) => void;
  onPreviewInstrument: (instrument: Instrument) => void;
  onUpdateInstrumentStatus: ({
    instrument,
    status,
  }: {
    instrument: Instrument;
    status: string;
  }) => void;
}) {
  const kit = getRouteKit(dossier.executionProfile);
  const routeDocuments = documents.filter(
    (document) =>
      document.instrumentType &&
      kit.instrumentTypes.includes(document.instrumentType),
  );

  return (
    <section className="rounded-xl border border-cyan-900/50 bg-cyan-950/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-500">
            Execution Route Kit
          </div>

          <h3 className="mt-1 text-sm font-semibold text-white">
            {dossier.executionProfileLabel ?? kit.label}
          </h3>

          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
            {kit.description}
          </p>
        </div>

        <div className="rounded border border-cyan-900 bg-cyan-950/30 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
          {routeDocuments.length} route records
        </div>
      </div>

      {routeDocuments.length === 0 ? (
        <div className="mt-3 rounded border border-amber-900 bg-amber-950/20 p-2 text-xs text-amber-300">
          No dedicated route records are available yet. Keep this dossier in
          manual review until the execution lane is confirmed.
        </div>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {routeDocuments.map((document) => {
            const status = getDocumentStatus(document, instruments);
            const canCreateDraft =
              Boolean(document.instrumentType && document.canDraftInstrument) &&
              !status.instrument;
            const isCreating = creatingType === document.instrumentType;
            const previewLoading =
              status.instrument && loadingPreviewId === status.instrument.id;
            const statusActions = status.instrument
              ? getStatusActions(status.instrument)
              : [];

            return (
              <div
                key={document.key}
                className="rounded border border-neutral-800 bg-black/30 p-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-white">
                      {document.label}
                    </div>

                    <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                      {document.requiredFor}
                    </div>
                  </div>

                  <div
                    className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${status.tone}`}
                  >
                    {status.label}
                  </div>
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
                  {document.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {canCreateDraft ? (
                    <button
                      type="button"
                      disabled={Boolean(creatingType || updatingInstrumentId)}
                      onClick={() => onCreateDraft(document)}
                      className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                    >
                      {isCreating ? "Creating..." : "Create Draft"}
                    </button>
                  ) : null}

                  {status.instrument ? (
                    <button
                      type="button"
                      disabled={Boolean(loadingPreviewId)}
                      onClick={() =>
                        onPreviewInstrument(status.instrument as Instrument)
                      }
                      className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                    >
                      {previewLoading
                        ? "Loading..."
                        : previewInstrumentId === status.instrument.id
                          ? "Hide Preview"
                          : "Preview Draft"}
                    </button>
                  ) : null}

                  {statusActions.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={Boolean(creatingType || updatingInstrumentId)}
                      onClick={() =>
                        status.instrument
                          ? onUpdateInstrumentStatus({
                              instrument: status.instrument,
                              status: action.status,
                            })
                          : undefined
                      }
                      className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                    >
                      {updatingInstrumentId === status.instrument?.id
                        ? "Updating..."
                        : action.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getDocumentStatus(
  document: RequiredDossierDocument,
  instruments: Instrument[],
) {
  if (!document.instrumentType) {
    return {
      label: "PENDING",
      tone: statusTone("PENDING"),
      instrument: null,
    };
  }

  const instrument = instruments.find(
    (item) => item.type === document.instrumentType,
  );

  if (!instrument) {
    return {
      label: "PENDING",
      tone: statusTone("PENDING"),
      instrument: null,
    };
  }

  return {
    label: instrument.status,
    tone: statusTone(instrument.status),
    instrument,
  };
}

function getSummary({
  dossier,
  parties,
  terms,
}: {
  dossier: DossierDependencyContext;
  parties: DossierParty[];
  terms: DossierTerms | null;
}) {
  const requiredDocuments = DOSSIER_DOCUMENT_GROUPS.flatMap(
    (group) => group.documents,
  );

  return requiredDocuments.reduce(
    (summary, document) => {
      const readiness = buildDependencyReadiness({
        document,
        dossier,
        parties,
        terms,
      });

      if (readiness.label === "Ready") {
        summary.ready += 1;
      } else if (readiness.label === "Draftable") {
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

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "red" | "neutral";
}) {
  const toneClass = {
    emerald: "border-emerald-900 bg-emerald-950/20 text-emerald-300",
    amber: "border-amber-900 bg-amber-950/20 text-amber-300",
    red: "border-red-900 bg-red-950/20 text-red-300",
    neutral: "border-neutral-800 bg-black/30 text-neutral-400",
  }[tone];

  return (
    <div
      className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${toneClass}`}
    >
      {value} {label}
    </div>
  );
}

function DocumentFilterButton({
  active,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-3 py-2 text-left transition ${
        active
          ? "border-cyan-800 bg-cyan-950/20 text-cyan-200"
          : "border-neutral-800 bg-black/20 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide">{label}</div>

      <p className="mt-1 text-[10px] leading-relaxed opacity-70">{detail}</p>
    </button>
  );
}

function getStatusActions(instrument: Instrument) {
  switch (instrument.status) {
    case "DRAFT":
      return [
        {
          label: "Activate",
          status: "ACTIVE",
        },
        {
          label: "Archive",
          status: "ARCHIVED",
        },
      ];

    case "ACTIVE":
      return [
        {
          label: "Mark Executed",
          status: "EXECUTED",
        },
        {
          label: "Archive",
          status: "ARCHIVED",
        },
      ];

    case "EXECUTED":
    case "ARCHIVED":
    case "SUPERSEDED":
    default:
      return [];
  }
}

function getPreviewReadiness(preview: RenderPreview) {
  if (preview.missingFields.length > 0) {
    return {
      label: "Internal Only",
      issuance: "Not Ready",
      tone: "border-red-900 bg-red-950/20 text-red-300",
      detail:
        "Required fields are missing. This draft should not be issued externally.",
    };
  }

  if (preview.warnings.length > 0) {
    return {
      label: "Review Required",
      issuance: "Hold for Review",
      tone: "border-amber-900 bg-amber-950/20 text-amber-300",
      detail:
        "No required fields are missing, but warnings should be reviewed before external issuance.",
    };
  }

  return {
    label: "Issuance Ready",
    issuance: "Ready for Review",
    tone: "border-emerald-900 bg-emerald-950/20 text-emerald-300",
    detail:
      "No missing fields or warnings are currently reported by the renderer.",
  };
}

function PreviewReadinessSummary({ preview }: { preview: RenderPreview }) {
  const readiness = getPreviewReadiness(preview);

  return (
    <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Draft Readiness
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {readiness.label}
          </div>

          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
            {readiness.detail}
          </p>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${readiness.tone}`}
        >
          External Issuance: {readiness.issuance}
        </div>
      </div>

      <div className="mt-3 grid min-w-0 gap-2 text-[11px] md:grid-cols-3">
        <div className="rounded border border-red-900/60 bg-red-950/10 p-2 text-red-300">
          {preview.missingFields.length} Missing
        </div>

        <div className="rounded border border-amber-900/60 bg-amber-950/10 p-2 text-amber-300">
          {preview.warnings.length} Warnings
        </div>

        <div className="rounded border border-neutral-800 bg-black/30 p-2 text-neutral-400">
          {preview.instrumentType} Preview
        </div>
      </div>
    </div>
  );
}

function PreviewIssueGroup({
  title,
  issues,
}: {
  title: string;
  issues: TemplateIssue[];
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded border border-neutral-800 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wide text-neutral-500">
          {title}
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
          {issues.length}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="mt-3 text-xs text-neutral-600">None recorded.</div>
      ) : (
        <div className="mt-3 grid gap-2">
          {issues.map((issue) => (
            <div
              key={`${issue.field}-${issue.label}`}
              className={`min-w-0 overflow-hidden rounded border p-2 text-xs ${issueTone(
                issue.status,
              )}`}
            >
              <div className="font-medium">{issue.label}</div>
              <div className="mt-1 break-words text-[11px] opacity-80">
                {issue.detail}
              </div>
              <div className="mt-1 break-all text-[10px] uppercase tracking-wide opacity-60">
                {issue.field}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RenderPreviewPanel({ preview }: { preview: RenderPreview }) {
  return (
    <div className="mt-3 min-w-0 overflow-hidden rounded border border-cyan-900/50 bg-cyan-950/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">
            Draft Preview
          </div>

          <h4 className="mt-1 text-sm font-medium text-white">
            {preview.title}
          </h4>
        </div>

        <div className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
          {preview.instrumentType}
        </div>
      </div>

      <PreviewReadinessSummary preview={preview} />

      <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-2">
        <PreviewIssueGroup
          title="Missing Fields"
          issues={preview.missingFields}
        />

        <PreviewIssueGroup title="Warnings" issues={preview.warnings} />
      </div>

      <div className="mt-3 min-w-0 overflow-hidden rounded border border-neutral-800 bg-black/40 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wide text-neutral-500">
          Rendered Text
        </div>

        <pre className="max-h-[420px] max-w-full overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed text-neutral-300">
          {preview.renderedText}
        </pre>
      </div>
    </div>
  );
}

export default function DossierDocumentsPanel({
  dossierId,
  dossier,
  parties,
  terms,
  instruments,
  onInstrumentChanged,
}: Props) {
  const summary = getSummary({
    dossier,
    parties,
    terms,
  });
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("ROUTE");

  const filteredDocumentGroups = getFilteredDocumentGroups({
    filter: documentFilter,
    profile: dossier.executionProfile,
  });
  const [creatingType, setCreatingType] = useState<string | null>(null);

  const [updatingInstrumentId, setUpdatingInstrumentId] = useState<
    string | null
  >(null);

  const [previewInstrumentId, setPreviewInstrumentId] = useState<string | null>(
    null,
  );

  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  const [previews, setPreviews] = useState<Record<string, RenderPreview>>({});

  const [error, setError] = useState<string | null>(null);

  async function createDraftInstrument(document: RequiredDossierDocument) {
    if (!document.instrumentType || creatingType) {
      return;
    }

    setCreatingType(document.instrumentType);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}/instruments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instrumentType: document.instrumentType,
            title: document.label,
          }),
        },
      );

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "INSTRUMENT_DRAFT_FAILED");
      }

      onInstrumentChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "INSTRUMENT_DRAFT_FAILED");
    } finally {
      setCreatingType(null);
    }
  }

  async function updateInstrumentStatus({
    instrument,
    status,
  }: {
    instrument: Instrument;
    status: string;
  }) {
    if (updatingInstrumentId) {
      return;
    }

    setUpdatingInstrumentId(instrument.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/instruments/${instrument.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            note: `${instrument.title} moved from ${instrument.status} to ${status} from the document readiness matrix.`,
          }),
        },
      );

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "INSTRUMENT_STATUS_UPDATE_FAILED");
      }

      onInstrumentChanged?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "INSTRUMENT_STATUS_UPDATE_FAILED",
      );
    } finally {
      setUpdatingInstrumentId(null);
    }
  }

  async function toggleRenderPreview(instrument: Instrument) {
    if (previewInstrumentId === instrument.id) {
      setPreviewInstrumentId(null);
      return;
    }

    setPreviewInstrumentId(instrument.id);

    window.setTimeout(() => {
      document
        .getElementById(`preview-${instrument.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    if (previews[instrument.id]) {
      return;
    }

    setLoadingPreviewId(instrument.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/instruments/${instrument.id}/render-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const payload = (await response.json()) as {
        ok: boolean;
        preview?: RenderPreview;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.preview) {
        throw new Error(payload.error ?? "INSTRUMENT_RENDER_PREVIEW_FAILED");
      }

      setPreviews((current) => ({
        ...current,
        [instrument.id]: payload.preview as RenderPreview,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "INSTRUMENT_RENDER_PREVIEW_FAILED",
      );
    } finally {
      setLoadingPreviewId(null);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Document Readiness
          </div>

          <h3 className="mt-1 text-sm font-medium text-white">
            Route Kit & Document Matrix
          </h3>

          <p className="mt-1 max-w-2xl text-xs text-neutral-500">
            Use this panel to see which documents have enough dossier data to
            draft, then create and preview internal instruments before external
            issuance.
          </p>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {instruments.length} Instruments
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded border border-red-900 bg-red-950/20 p-2 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      <ActiveDocumentTaskPanel
        dossier={dossier}
        instruments={instruments}
        updatingInstrumentId={updatingInstrumentId}
        onUpdateInstrumentStatus={updateInstrumentStatus}
      />

      <RouteKitPanel
        dossier={dossier}
        documents={DOSSIER_DOCUMENT_GROUPS.flatMap((group) => group.documents)}
        instruments={instruments}
        creatingType={creatingType}
        updatingInstrumentId={updatingInstrumentId}
        loadingPreviewId={loadingPreviewId}
        previewInstrumentId={previewInstrumentId}
        onCreateDraft={createDraftInstrument}
        onPreviewInstrument={toggleRenderPreview}
        onUpdateInstrumentStatus={updateInstrumentStatus}
      />

      <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-3">
        <div className="text-[10px] uppercase tracking-wide text-neutral-600">
          Package Data Readiness
        </div>

        <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
          Counts reflect dossier data readiness, not whether a draft artifact
          has already been created.
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <SummaryPill label="Ready" value={summary.ready} tone="emerald" />
          <SummaryPill
            label="Draftable"
            value={summary.draftable}
            tone="amber"
          />
          <SummaryPill label="Blocked" value={summary.blocked} tone="red" />
          <SummaryPill label="Required" value={summary.total} tone="neutral" />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-neutral-800 bg-black/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Document View
            </div>

            <h4 className="mt-1 text-sm font-medium text-white">
              Choose the document set for this operator task
            </h4>

            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
              Start with the current route. Expand to core package or all
              documents only when deeper review is needed.
            </p>
          </div>

          <div className="rounded border border-neutral-800 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
            {filteredDocumentGroups.reduce(
              (count, group) => count + group.documents.length,
              0,
            )}{" "}
            visible
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <DocumentFilterButton
            active={documentFilter === "ROUTE"}
            label="Current Route"
            detail="Only documents for this execution lane."
            onClick={() => setDocumentFilter("ROUTE")}
          />

          <DocumentFilterButton
            active={documentFilter === "CORE"}
            label="Core Package"
            detail="Buyer, seller, SPA, annexes, and compensation."
            onClick={() => setDocumentFilter("CORE")}
          />

          <DocumentFilterButton
            active={documentFilter === "ALL"}
            label="Audit Library"
            detail="Full document inventory for audit and deep review."
            onClick={() => setDocumentFilter("ALL")}
          />
        </div>
      </div>

      <details className="mt-3 rounded-xl border border-neutral-800 bg-black/20 p-3">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Selected Document Workbench
              </div>

              <h4 className="mt-1 text-sm font-medium text-white">
                Expand to create, activate, preview, or review selected
                documents
              </h4>

              <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
                The matrix follows the selected filter above, so operators can
                review the current route, core package, or full dossier library.
              </p>
            </div>

            <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
              {documentFilter} view
            </div>
          </div>
        </summary>

        <div className="mt-3 space-y-3">
          {filteredDocumentGroups.map((group) => (
            <section
              key={group.title}
              className="rounded border border-neutral-800 bg-black/30 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                    {group.title}
                  </h4>

                  <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
                    {group.description}
                  </p>
                </div>

                <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
                  {group.documents.length} Items
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                {group.documents.map((document) => {
                  const status = getDocumentStatus(document, instruments);

                  const dependencyReadiness = buildDependencyReadiness({
                    document,
                    dossier,
                    parties,
                    terms,
                  });

                  const canCreateDraft =
                    Boolean(
                      document.instrumentType && document.canDraftInstrument,
                    ) && !status.instrument;

                  const isCreating = creatingType === document.instrumentType;

                  const statusActions = status.instrument
                    ? getStatusActions(status.instrument)
                    : [];

                  const activePreview =
                    status.instrument &&
                    previewInstrumentId === status.instrument.id
                      ? previews[status.instrument.id]
                      : null;

                  const previewLoading =
                    status.instrument &&
                    loadingPreviewId === status.instrument.id;

                  return (
                    <div
                      key={document.key}
                      className="rounded border border-neutral-800 bg-black/30 p-3 text-xs"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-white">
                            {status.instrument?.title ?? document.label}
                          </div>

                          <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                            {document.instrumentType ??
                              "OPERATIONAL_REQUIREMENT"}
                            {status.instrument
                              ? ` · ${status.instrument.version}`
                              : ""}
                            {" · "}
                            {document.requiredFor}
                          </div>

                          <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500">
                            {document.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                          <div className="rounded border border-neutral-800 bg-black/30 p-2 text-right">
                            <div className="text-[9px] uppercase tracking-wide text-neutral-600">
                              Artifact Status
                            </div>

                            <div
                              className={`mt-1 rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${status.tone}`}
                            >
                              {status.label}
                            </div>
                          </div>

                          {canCreateDraft ? (
                            <button
                              type="button"
                              disabled={Boolean(
                                creatingType || updatingInstrumentId,
                              )}
                              onClick={() => createDraftInstrument(document)}
                              className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                            >
                              {isCreating ? "Creating..." : "Create Draft"}
                            </button>
                          ) : null}

                          {status.instrument ? (
                            <button
                              type="button"
                              disabled={Boolean(loadingPreviewId)}
                              onClick={() =>
                                toggleRenderPreview(
                                  status.instrument as Instrument,
                                )
                              }
                              className="rounded border border-cyan-900 bg-cyan-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                            >
                              {previewLoading
                                ? "Loading..."
                                : previewInstrumentId === status.instrument.id
                                  ? "Hide Preview"
                                  : "Preview Draft"}
                            </button>
                          ) : null}

                          {statusActions.map((action) => (
                            <button
                              key={action.status}
                              type="button"
                              disabled={Boolean(
                                creatingType || updatingInstrumentId,
                              )}
                              onClick={() =>
                                status.instrument
                                  ? updateInstrumentStatus({
                                      instrument: status.instrument,
                                      status: action.status,
                                    })
                                  : undefined
                              }
                              className="rounded border border-neutral-700 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-cyan-700 hover:text-cyan-300 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
                            >
                              {updatingInstrumentId === status.instrument?.id
                                ? "Updating..."
                                : action.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <DependencyReadinessPanel
                        readiness={dependencyReadiness}
                      />

                      {previewLoading ? (
                        <div className="mt-3 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
                          Loading render preview...
                        </div>
                      ) : null}

                      {activePreview && status.instrument ? (
                        <div
                          id={`preview-${status.instrument.id}`}
                          className="scroll-mt-6"
                        >
                          <RenderPreviewPanel preview={activePreview} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </details>
    </div>
  );
}
