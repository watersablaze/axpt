"use client";

import {
  useEffect,
  useState,
} from "react";

type ReviewCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

type ReviewStatus = {
  dossierId: string;
  state: string;
  readiness: {
    passed: boolean;
    checks: ReviewCheck[];
  };
  confirmation: {
    confirmed: boolean;
    current: boolean;
    stale: boolean;
    confirmedAt: string | null;
    latestPartyMutationAt: string | null;
  };
};

type ReviewResponse = {
  ok: boolean;
  review?: ReviewStatus;
  alreadyConfirmed?: boolean;
  error?: string;
  checks?: ReviewCheck[];
};

type Props = {
  dossierId: string;
  currentState: string;
  onChanged?: () => void;
};

function tone(
  passed: boolean,
) {
  return passed
    ? "border-emerald-900 bg-emerald-950/10 text-emerald-300"
    : "border-amber-900 bg-amber-950/10 text-amber-300";
}

export function DossierKycReviewPanel({
  dossierId,
  currentState,
  onChanged,
}: Props) {
  const [
    review,
    setReview,
  ] =
    useState<ReviewStatus | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    confirming,
    setConfirming,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  async function loadReview() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/admin/control-center/dossiers/${dossierId}/kyc-review`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );

      const payload =
        (await response.json()) as ReviewResponse;

      if (
        !response.ok ||
        !payload.ok ||
        !payload.review
      ) {
        throw new Error(
          payload.error ??
            "KYC_REVIEW_LOAD_FAILED",
        );
      }

      setReview(payload.review);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "KYC_REVIEW_LOAD_FAILED",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReview();
  }, [dossierId]);

  async function confirmReview() {
    if (
      confirming ||
      !review?.readiness.passed
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Confirm that party identity, representative authority, jurisdiction, and source context have been reviewed sufficiently to begin SPA drafting? This is not final compliance or execution approval.",
      );

    if (!confirmed) return;

    setConfirming(true);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/admin/control-center/dossiers/${dossierId}/kyc-review`,
          {
            method: "POST",
            cache: "no-store",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              confirmed: true,
            }),
          },
        );

      const payload =
        (await response.json()) as ReviewResponse;

      if (
        !response.ok ||
        !payload.ok ||
        !payload.review
      ) {
        throw new Error(
          payload.error ??
            "KYC_REVIEW_CONFIRM_FAILED",
        );
      }

      setReview(payload.review);
      onChanged?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "KYC_REVIEW_CONFIRM_FAILED",
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-black/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            KYC Review Authority
          </div>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Identity, Authority & Source Review
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            This disposition records that available party identity,
            representative authority, jurisdiction, and source context have
            been reviewed sufficiently to begin SPA drafting. It is not final
            compliance clearance and does not authorize execution.
          </p>
        </div>

        {review ? (
          <div
            className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
              review.confirmation.current
                ? "border-emerald-900 bg-emerald-950/10 text-emerald-300"
                : review.confirmation.stale
                  ? "border-amber-900 bg-amber-950/10 text-amber-300"
                  : "border-neutral-800 bg-black/20 text-neutral-500"
            }`}
          >
            {review.confirmation.current
              ? "Review Confirmed"
              : review.confirmation.stale
                ? "Review Stale"
                : "Review Open"}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 rounded border border-neutral-800 bg-black/20 p-3 text-xs text-neutral-500">
          Loading KYC review readiness...
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {review ? (
        <>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {review.readiness.checks.map(
              (check) => (
                <div
                  key={check.id}
                  className={`rounded border p-3 ${tone(
                    check.passed,
                  )}`}
                >
                  <div className="text-xs font-medium">
                    {check.label}
                  </div>

                  <div className="mt-1 text-[11px] leading-relaxed opacity-70">
                    {check.detail}
                  </div>
                </div>
              ),
            )}
          </div>

          {review.confirmation.stale ? (
            <div className="mt-3 rounded border border-amber-900 bg-amber-950/10 p-3 text-xs text-amber-300">
              Party records changed after the previous KYC review disposition.
              Reconfirm the review before SPA drafting.
            </div>
          ) : null}

          {currentState ===
            "KYC_REVIEW" &&
          !review.confirmation.current ? (
            <button
              type="button"
              disabled={
                confirming ||
                !review.readiness.passed
              }
              onClick={() =>
                void confirmReview()
              }
              className="mt-4 rounded border border-cyan-900 bg-cyan-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-black/20 disabled:text-neutral-600"
            >
              {confirming
                ? "Confirming..."
                : "Confirm Review for SPA Drafting"}
            </button>
          ) : null}

          {currentState !==
          "KYC_REVIEW" ? (
            <div className="mt-4 text-[11px] text-neutral-600">
              Review disposition can be recorded only while the dossier is in
              KYC_REVIEW.
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
