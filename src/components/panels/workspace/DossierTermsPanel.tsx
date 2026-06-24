"use client";

import { useEffect, useMemo, useState } from "react";

type DossierTerms = {
  id?: string;
  dossierId?: string;

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

type TermsResponse = {
  ok?: boolean;
  terms?: DossierTerms;
  error?: string;
  message?: string;
};

type Props = {
  dossierId: string;
  onTermsChanged?: () => void;
};

const EMPTY_TERMS: DossierTerms = {
  settlementMethod: null,
  financialInstrumentType: null,
  issuingInstitution: null,
  instrumentAmountOrCoverage: null,
  validityPeriod: null,
  paymentTrigger: null,
  beneficiary: null,

  sellerSideCompensation: null,
  buyerSideCompensation: null,
  compensationPayer: null,
  compensationPayees: null,
  compensationPayoutTrigger: null,
  compensationPaymentMethod: null,
  compensationAuthorizationStatus: null,
  compensationConfidentialityNote: null,
};

const FIELD_KEYS: Array<keyof DossierTerms> = [
  "settlementMethod",
  "financialInstrumentType",
  "issuingInstitution",
  "instrumentAmountOrCoverage",
  "validityPeriod",
  "paymentTrigger",
  "beneficiary",
  "sellerSideCompensation",
  "buyerSideCompensation",
  "compensationPayer",
  "compensationPayees",
  "compensationPayoutTrigger",
  "compensationPaymentMethod",
  "compensationAuthorizationStatus",
  "compensationConfidentialityNote",
];

function toInputValue(value: string | null | undefined) {
  return value ?? "";
}

function fromInputValue(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function getCompletionCount(terms: DossierTerms) {
  return FIELD_KEYS.filter((key) => {
    const value = terms[key];

    return typeof value === "string" && value.trim().length > 0;
  }).length;
}

type TermsReviewState = "COMPLETE" | "PARTIAL" | "SEEDED" | "NEEDS_REVIEW";

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasSeededTermsNote(terms: DossierTerms) {
  const note =
    terms.compensationConfidentialityNote?.trim().toLowerCase() ?? "";

  return (
    note.startsWith("seeded from") ||
    note.includes("seeded from source intake") ||
    note.includes("seeded from promoted opportunity") ||
    note.includes("seeded from source intake for operator review")
  );
}

function hasOperatorTermsConfirmation(terms: DossierTerms) {
  const note =
    terms.compensationConfidentialityNote?.trim().toLowerCase() ?? "";

  return (
    note.includes("operator confirmed") ||
    note.includes("terms confirmed") ||
    note.includes("settlement confirmed") ||
    note.includes("authority confirmed") ||
    note.includes("review complete")
  );
}

function getSettlementReviewState(terms: DossierTerms): TermsReviewState {
  const hasSettlementMethod = hasValue(terms.settlementMethod);
  const hasBeneficiary = hasValue(terms.beneficiary);
  const hasPaymentTrigger = hasValue(terms.paymentTrigger);
  const seeded = hasSeededTermsNote(terms);
  const confirmed = hasOperatorTermsConfirmation(terms);

  if (!hasSettlementMethod) {
    return "NEEDS_REVIEW";
  }

  if (seeded && !confirmed) {
    return "SEEDED";
  }

  if (hasSettlementMethod && hasBeneficiary && hasPaymentTrigger) {
    return "COMPLETE";
  }

  return "PARTIAL";
}

function getFinancialInstrumentReviewState(
  terms: DossierTerms,
): TermsReviewState {
  const hasType = hasValue(terms.financialInstrumentType);
  const hasInstitution = hasValue(terms.issuingInstitution);
  const hasCoverage = hasValue(terms.instrumentAmountOrCoverage);
  const hasValidity = hasValue(terms.validityPeriod);
  const seeded = hasSeededTermsNote(terms);
  const confirmed = hasOperatorTermsConfirmation(terms);

  if (!hasType) {
    return "NEEDS_REVIEW";
  }

  if (seeded && !confirmed) {
    return "SEEDED";
  }

  if (hasType && hasInstitution && hasCoverage && hasValidity) {
    return "COMPLETE";
  }

  return "PARTIAL";
}

function getCompensationReviewState(terms: DossierTerms): TermsReviewState {
  const hasPayer = hasValue(terms.compensationPayer);
  const hasPayees = hasValue(terms.compensationPayees);
  const hasTrigger = hasValue(terms.compensationPayoutTrigger);
  const hasAuthorization = hasValue(terms.compensationAuthorizationStatus);
  const hasAnyCompensation =
    hasValue(terms.sellerSideCompensation) ||
    hasValue(terms.buyerSideCompensation) ||
    hasValue(terms.compensationPaymentMethod) ||
    hasValue(terms.compensationConfidentialityNote) ||
    hasPayer ||
    hasPayees ||
    hasTrigger ||
    hasAuthorization;
  const seeded = hasSeededTermsNote(terms);
  const confirmed = hasOperatorTermsConfirmation(terms);

  if (!hasAnyCompensation) {
    return "NEEDS_REVIEW";
  }

  if (seeded && !confirmed && !hasPayer && !hasPayees && !hasTrigger) {
    return "SEEDED";
  }

  if (hasPayer && hasPayees && hasTrigger && hasAuthorization) {
    return "COMPLETE";
  }

  return "PARTIAL";
}

function reviewTone(state: TermsReviewState) {
  switch (state) {
    case "COMPLETE":
      return "border-emerald-900 bg-emerald-950/20 text-emerald-300";

    case "PARTIAL":
      return "border-amber-900 bg-amber-950/20 text-amber-300";

    case "SEEDED":
      return "border-cyan-900 bg-cyan-950/20 text-cyan-300";

    case "NEEDS_REVIEW":
      return "border-red-900 bg-red-950/20 text-red-300";
  }
}

function reviewLabel(state: TermsReviewState) {
  return state.replace("_", " ");
}

function TermsReviewCard({
  title,
  state,
  detail,
}: {
  title: string;
  state: TermsReviewState;
  detail: string;
}) {
  return (
    <div className="rounded border border-neutral-800 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            {title}
          </div>

          <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-neutral-500">
            {detail}
          </p>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${reviewTone(
            state,
          )}`}
        >
          {reviewLabel(state)}
        </div>
      </div>
    </div>
  );
}

async function readJsonResponse(response: Response): Promise<TermsResponse> {
  const text = await response.text();

  if (!text.trim()) {
    return {
      ok: false,
      error: `EMPTY_RESPONSE_${response.status}`,
    };
  }

  try {
    return JSON.parse(text) as TermsResponse;
  } catch {
    return {
      ok: false,
      error: `INVALID_JSON_RESPONSE_${response.status}`,
      message: text.slice(0, 180),
    };
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-y rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
        />
      )}
    </label>
  );
}

export function DossierTermsPanel({ dossierId, onTermsChanged }: Props) {
  const [terms, setTerms] = useState<DossierTerms>(EMPTY_TERMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const completionCount = useMemo(() => getCompletionCount(terms), [terms]);

  const settlementReviewState = useMemo(
    () => getSettlementReviewState(terms),
    [terms],
  );

  const financialInstrumentReviewState = useMemo(
    () => getFinancialInstrumentReviewState(terms),
    [terms],
  );

  const compensationReviewState = useMemo(
    () => getCompensationReviewState(terms),
    [terms],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTerms() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/control-center/dossiers/${dossierId}/terms`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const data = await readJsonResponse(response);

        if (!response.ok || !data.ok || !data.terms) {
          throw new Error(
            data.message ?? data.error ?? "Unable to load dossier terms.",
          );
        }

        if (!cancelled) {
          setTerms({
            ...EMPTY_TERMS,
            ...data.terms,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dossier terms.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTerms();

    return () => {
      cancelled = true;
    };
  }, [dossierId]);

  function updateTerm(key: keyof DossierTerms, value: string) {
    setTerms((current) => ({
      ...current,
      [key]: fromInputValue(value),
    }));
  }

  async function saveTerms() {
    setSaving(true);
    setError(null);
    setSavedAt(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}/terms`,
        {
          method: "PATCH",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(terms),
        },
      );

      const data = await readJsonResponse(response);

      if (!response.ok || !data.ok || !data.terms) {
        throw new Error(
          data.message ?? data.error ?? "Unable to save dossier terms.",
        );
      }

      setTerms({
        ...EMPTY_TERMS,
        ...data.terms,
      });
      setSavedAt(new Date().toLocaleTimeString());
      onTermsChanged?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save dossier terms.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-black/30 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            Structured Terms
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Operator Terms Panel
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            Internal-only commercial truth used to mature settlement, financial
            instrument, and compensation drafts.
          </p>
        </div>

        <div className="rounded border border-neutral-800 bg-black/40 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {completionCount}/15 fields structured
          </div>

          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-200">
            {completionCount === 15
              ? "Complete"
              : completionCount > 0
                ? "In Progress"
                : "Unstructured"}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
          Loading structured terms...
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <TermsReviewCard
              title="Settlement Terms"
              state={settlementReviewState}
              detail="Settlement method, beneficiary, and payment trigger maturity."
            />

            <TermsReviewCard
              title="Financial Instrument"
              state={financialInstrumentReviewState}
              detail="Instrument type, issuing institution, coverage, and validity maturity."
            />

            <TermsReviewCard
              title="Compensation"
              state={compensationReviewState}
              detail="Payer, payees, payout trigger, and authorization maturity."
            />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <h4 className="mb-3 text-sm font-semibold text-white">
                Settlement Terms
              </h4>

              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Settlement method"
                  value={toInputValue(terms.settlementMethod)}
                  onChange={(value) => updateTerm("settlementMethod", value)}
                  placeholder="MT103, escrow, cash, DLC, SBLC..."
                />

                <Field
                  label="Financial instrument type"
                  value={toInputValue(terms.financialInstrumentType)}
                  onChange={(value) =>
                    updateTerm("financialInstrumentType", value)
                  }
                  placeholder="DLC, SBLC, MT103, escrow..."
                />

                <Field
                  label="Issuing / escrow institution"
                  value={toInputValue(terms.issuingInstitution)}
                  onChange={(value) => updateTerm("issuingInstitution", value)}
                  placeholder="Issuing bank, escrow bank, trust account..."
                />

                <Field
                  label="Instrument amount / coverage basis"
                  value={toInputValue(terms.instrumentAmountOrCoverage)}
                  onChange={(value) =>
                    updateTerm("instrumentAmountOrCoverage", value)
                  }
                  placeholder="Trial value, monthly coverage..."
                />

                <Field
                  label="Validity / tenor"
                  value={toInputValue(terms.validityPeriod)}
                  onChange={(value) => updateTerm("validityPeriod", value)}
                  placeholder="365+1, 30 days..."
                />

                <Field
                  label="Beneficiary / receiving party"
                  value={toInputValue(terms.beneficiary)}
                  onChange={(value) => updateTerm("beneficiary", value)}
                  placeholder="Seller, escrow account, trust account..."
                />

                <div className="md:col-span-2">
                  <Field
                    label="Payment trigger"
                    value={toInputValue(terms.paymentTrigger)}
                    onChange={(value) => updateTerm("paymentTrigger", value)}
                    placeholder="Assay confirmation, escrow release, MT103 confirmation..."
                    multiline
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <h4 className="mb-3 text-sm font-semibold text-white">
                Compensation Terms
              </h4>

              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="Seller-side compensation"
                  value={toInputValue(terms.sellerSideCompensation)}
                  onChange={(value) =>
                    updateTerm("sellerSideCompensation", value)
                  }
                  placeholder="$5,000 seller side..."
                />

                <Field
                  label="Buyer-side compensation"
                  value={toInputValue(terms.buyerSideCompensation)}
                  onChange={(value) =>
                    updateTerm("buyerSideCompensation", value)
                  }
                  placeholder="$5,000 buyer side..."
                />

                <Field
                  label="Compensation payer"
                  value={toInputValue(terms.compensationPayer)}
                  onChange={(value) => updateTerm("compensationPayer", value)}
                  placeholder="Buyer, seller, escrow manager..."
                />

                <Field
                  label="Compensation payment method"
                  value={toInputValue(terms.compensationPaymentMethod)}
                  onChange={(value) =>
                    updateTerm("compensationPaymentMethod", value)
                  }
                  placeholder="Wire, escrow disbursement..."
                />

                <Field
                  label="Authorization status"
                  value={toInputValue(terms.compensationAuthorizationStatus)}
                  onChange={(value) =>
                    updateTerm("compensationAuthorizationStatus", value)
                  }
                  placeholder="Pending written confirmation..."
                />

                <div className="md:col-span-2">
                  <Field
                    label="Compensation payees"
                    value={toInputValue(terms.compensationPayees)}
                    onChange={(value) =>
                      updateTerm("compensationPayees", value)
                    }
                    placeholder="Representative names, entities, beneficiaries..."
                    multiline
                  />
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Compensation payout trigger"
                    value={toInputValue(terms.compensationPayoutTrigger)}
                    onChange={(value) =>
                      updateTerm("compensationPayoutTrigger", value)
                    }
                    placeholder="Upon settlement, escrow release, successful assay..."
                    multiline
                  />
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Confidentiality / NCND note"
                    value={toInputValue(terms.compensationConfidentialityNote)}
                    onChange={(value) =>
                      updateTerm("compensationConfidentialityNote", value)
                    }
                    placeholder="Representative protection, non-circumvention, confidentiality notes..."
                    multiline
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveTerms}
              disabled={saving}
              className="rounded border border-neutral-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving Terms..." : "Save Structured Terms"}
            </button>

            {savedAt ? (
              <span className="text-xs text-neutral-500">
                Saved at {savedAt}
              </span>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
