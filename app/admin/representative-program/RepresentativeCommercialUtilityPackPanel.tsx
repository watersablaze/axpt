"use client";

import {
  useState,
} from "react";

type CommercialUtilityPackResult = {
  id: string;
  reference: string;
  created: boolean;
  participantId: string;
  registeredResources: number;
  unavailableSources: number;
  eligibleModules: string[];
  blockedModules: string[];
  release: {
    performed: false;
  };
};

type PreparationResponse =
  | {
      ok: true;
      commercialUtilityPack:
        CommercialUtilityPackResult;
    }
  | {
      ok: false;
      error: string;
    };

function moduleLabel(
  value:
    string,
) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export default function RepresentativeCommercialUtilityPackPanel({
  participantId,
  candidateDisplayName,
}: {
  participantId:
    string;

  candidateDisplayName:
    string;
}) {
  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [result, setResult] =
    useState<
      CommercialUtilityPackResult | null
    >(
      null,
    );

  async function preparePack() {
    setBusy(
      true,
    );

    setError(
      null,
    );

    try {
      const response =
        await fetch(
          "/api/admin/representative-program/commercial-utility-packs/prepare",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            cache:
              "no-store",

            body:
              JSON.stringify({
                participantId,
              }),
          },
        );

      const payload =
        (await response.json()) as
          PreparationResponse;

      if (
        !response.ok ||
        !payload.ok
      ) {
        setError(
          payload.ok
            ? "Unable to prepare the Commercial Utility Pack."
            : payload.error,
        );

        return;
      }

      setResult(
        payload.commercialUtilityPack,
      );
    } catch (
      cause
    ) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Commercial Utility Pack preparation failed.",
      );
    } finally {
      setBusy(
        false,
      );
    }
  }

  return (
    <section className="rounded border border-cyan-900/60 bg-cyan-950/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-500/70">
            Commercial Utility Pack
          </p>

          <h3 className="mt-2 text-base font-semibold text-white">
            Prepare Representative Field Resources
          </h3>
        </div>

        <span className="rounded border border-cyan-900/60 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">
          Preparation Only
        </span>
      </div>

      <p className="mt-3 text-sm leading-5 text-gray-400">
        Prepare or refresh the governed Commercial Utility Pack for{" "}
        <strong className="text-gray-200">
          {candidateDisplayName}
        </strong>
        . This operation composes currently available representative-safe
        resources and evaluates module readiness. It does not release resources,
        release modules, or deliver material to the representative.
      </p>

      <div className="mt-4 rounded border border-gray-800 bg-black p-3">
        <p className="text-xs leading-5 text-gray-500">
          Source Authority is not selected automatically. Commercial Parameters
          remain blocked until the canonical institutional record is CURRENT.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3 rounded border border-cyan-900/50 bg-black p-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-500/60">
              {result.created
                ? "CUP Prepared"
                : "Existing CUP Refreshed"}
            </p>

            <p className="mt-2 break-all font-mono text-xs text-cyan-100">
              {result.reference}
            </p>
          </div>

          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded border border-gray-900 bg-gray-950 p-3">
              <dt className="text-gray-500">
                Registered Resources
              </dt>

              <dd className="mt-1 text-gray-200">
                {result.registeredResources}
              </dd>
            </div>

            <div className="rounded border border-gray-900 bg-gray-950 p-3">
              <dt className="text-gray-500">
                Unavailable Sources
              </dt>

              <dd className="mt-1 text-gray-200">
                {result.unavailableSources}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">
              Eligible Modules
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {result.eligibleModules.length > 0 ? (
                result.eligibleModules.map(
                  (module) => (
                    <span
                      key={module}
                      className="rounded border border-emerald-900/60 bg-emerald-950/20 px-2 py-1 text-[10px] text-emerald-300"
                    >
                      {moduleLabel(
                        module,
                      )}
                    </span>
                  ),
                )
              ) : (
                <span className="text-xs text-gray-600">
                  None
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">
              Blocked Modules
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {result.blockedModules.length > 0 ? (
                result.blockedModules.map(
                  (module) => (
                    <span
                      key={module}
                      className="rounded border border-amber-900/60 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-300"
                    >
                      {moduleLabel(
                        module,
                      )}
                    </span>
                  ),
                )
              ) : (
                <span className="text-xs text-gray-600">
                  None
                </span>
              )}
            </div>
          </div>

          <div className="rounded border border-gray-800 bg-gray-950 p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">
              Release
            </p>

            <p className="mt-1 text-xs font-medium text-gray-300">
              NOT PERFORMED
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() =>
          void preparePack()
        }
        className="mt-4 rounded border border-cyan-700/60 bg-cyan-950/30 px-4 py-2.5 text-sm font-medium text-cyan-200 hover:bg-cyan-950/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? "Preparing CUP…"
          : result
            ? "Prepare / Refresh CUP Again"
            : "Prepare Commercial Utility Pack"}
      </button>
    </section>
  );
}
