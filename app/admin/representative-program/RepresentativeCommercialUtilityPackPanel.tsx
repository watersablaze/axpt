"use client";

import ResourcePermissionDecision from "./ResourcePermissionDecision";
import SelectedCupAdditionsRelease from "./SelectedCupAdditionsRelease";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type DurablePack = {
  id: string;
  reference: string;
  participantId: string;
  version: number;
  state: string;
  releaseState: string;
  modules: {
    module: string;
    state: string;
    currentResources: {
      id: string;
      label: string | null;
      resourceId: string;
      state: string;
      canView: boolean;
      canDownload: boolean;
      canPresent: boolean;
      canTransmit: boolean;
    }[];
  }[];
};

async function fetchDurablePack(
  participantId: string,
  signal?: AbortSignal,
): Promise<DurablePack | null> {
  const query = new URLSearchParams({
    participantId,
    version: "1",
  });
  const response = await fetch(
    `/api/admin/representative-program/commercial-utility-packs/state?${query}`,
    { method: "GET", cache: "no-store", signal },
  );
  const payload = await response.json();
  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.error || "Unable to load persisted CUP state.");
  }
  return payload.commercialUtilityPack;
}

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

  const [pack, setPack] = useState<DurablePack | null>(null);
  const [loading, setLoading] = useState(true);
  const [stateError, setStateError] = useState<string | null>(null);
  const generation = useRef(0);
  const actionInFlight = useRef(false);
  const [pendingModule, setPendingModule] = useState<string | null>(null);
  const [releasingModule, setReleasingModule] = useState<string | null>(null);
  const [releaseNotice, setReleaseNotice] = useState<string | null>(null);

  useEffect(() => {
    const current = ++generation.current;
    const controller = new AbortController();
    actionInFlight.current = false;
    setPendingModule(null);
    setReleasingModule(null);
    setReleaseNotice(null);
    setPack(null);
    setResult(null);
    setError(null);
    setStateError(null);
    setBusy(false);
    setLoading(true);

    void fetchDurablePack(participantId, controller.signal)
      .then((state) => {
        if (generation.current === current) setPack(state);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && generation.current === current) {
          setStateError(
            cause instanceof Error ? cause.message : "CUP state load failed.",
          );
        }
      })
      .finally(() => {
        if (generation.current === current) setLoading(false);
      });

    return () => {
      controller.abort();
      ++generation.current;
    };
  }, [participantId]);

  async function reloadPack() {
    const current = generation.current;
    setPendingModule(null);
    setLoading(true);
    setStateError(null);
    try {
      const state = await fetchDurablePack(participantId);
      if (generation.current === current) setPack(state);
    } catch (cause) {
      if (generation.current === current) {
        setPack(null);
        setStateError(
          cause instanceof Error ? cause.message : "CUP state reload failed.",
        );
      }
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }

  async function preparePack() {
    if (actionInFlight.current || loading || stateError) return;
    actionInFlight.current = true;
    setPendingModule(null);
    setReleaseNotice(null);
    const current = generation.current;
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

      if (generation.current !== current) return;

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

      setLoading(true);
      setStateError(null);
      try {
        const state = await fetchDurablePack(participantId);
        if (generation.current === current) setPack(state);
      } catch (cause) {
        if (generation.current === current) {
          setPack(null);
          setStateError(
            cause instanceof Error ? cause.message : "CUP state reload failed.",
          );
        }
      } finally {
        if (generation.current === current) setLoading(false);
      }
    } catch (
      cause
    ) {
      if (generation.current !== current) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Commercial Utility Pack preparation failed.",
      );
    } finally {
      if (generation.current !== current) return;
      actionInFlight.current = false;
      setBusy(
        false,
      );
    }
  }

  async function releaseModule(module: string) {
    if (
      actionInFlight.current || loading || stateError || !pack ||
      pack.participantId !== participantId ||
      pendingModule !== module ||
      pack.state === "SUPERSEDED" || pack.state === "WITHDRAWN" ||
      !pack.modules.some(entry =>
        entry.module === module && entry.state === "READY" &&
        entry.currentResources.length > 0
      )
    ) return;

    const current = generation.current;
    const packageId = pack.id;
    actionInFlight.current = true;
    setBusy(true);
    setReleasingModule(module);
    setPendingModule(null);
    setReleaseNotice(null);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        "/api/admin/representative-program/commercial-utility-packs/release-module",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            packageId,
            module,
            confirmRelease: true,
          }),
        },
      );
      const payload = await response.json();
      if (generation.current !== current) return;
      if (!response.ok || payload.ok !== true) {
        throw new Error(payload.error || "Module release was not confirmed.");
      }
      setReleaseNotice(
        moduleLabel(module) + " release confirmed. Persisted state is shown below.",
      );
    } catch (cause) {
      if (generation.current !== current) return;
      setError(
        (cause instanceof Error ? cause.message : "Module release was not confirmed.") +
        " Review the reloaded persisted state before retrying.",
      );
    } finally {
      if (generation.current === current) {
        await reloadPack();
        if (generation.current === current) {
          actionInFlight.current = false;
          setReleasingModule(null);
          setBusy(false);
        }
      }
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
            Govern Representative Field Resources
          </h3>
        </div>

        <span className="rounded border border-cyan-900/60 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">
          Preparation & Module Release
        </span>
      </div>

      <p className="mt-3 text-sm leading-5 text-gray-400">
        Prepare or refresh the governed Commercial Utility Pack for{" "}
        <strong className="text-gray-200">
          {candidateDisplayName}
        </strong>
        . Preparation composes currently available representative-safe
        resources and evaluates readiness. Each READY module requires a separate
        confirmed release decision. Resource permissions remain governed;
        release does not grant appointment authority or send a notification.
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

      {releaseNotice ? (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          {releaseNotice}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || loading}
        onClick={() => void reloadPack()}
        className="mt-4 rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 disabled:opacity-50"
      >
        Reload Persisted CUP State
      </button>

      {loading && pack ? (
        <p role="status" className="mt-3 text-xs text-gray-400">
          Updating persisted CUP state…
        </p>
      ) : null}
      <div className="mt-4 space-y-3" aria-live="polite" aria-busy={loading}>
        {loading && !pack ? (
          <p className="text-sm text-gray-400">Loading persisted CUP state…</p>
        ) : stateError ? (
          <p role="alert" className="text-sm text-red-300">{stateError}</p>
        ) : pack ? (
          <div className="space-y-3 rounded border border-cyan-900/50 bg-black p-3">
            <p className="text-xs uppercase tracking-widest text-cyan-400">
              Persisted CUP State
            </p>
            <p className="break-all font-mono text-xs text-cyan-100">
              {pack.reference} · Version {pack.version}
            </p>
            <p className="text-xs text-gray-300">
              Package: {pack.state} · Release: {pack.releaseState}
            </p>
            {pack.modules.map((entry) => (
              <div key={entry.module} className="rounded border border-gray-800 p-3">
                <p className="text-sm text-gray-200">
                  {moduleLabel(entry.module)} · {entry.state}
                </p>
                {entry.state === "READY" &&
                 entry.currentResources.length > 0 &&
                 pack.state !== "SUPERSEDED" &&
                 pack.state !== "WITHDRAWN" ? (
                  pendingModule === entry.module ? (
                    <div className="mt-3 rounded border border-amber-900/60 bg-amber-950/20 p-3">
                      <p className="text-xs leading-5 text-amber-200">
                        Release {moduleLabel(entry.module)} for {candidateDisplayName}?
                        This releases all {entry.currentResources.length} current
                        resources in this module under their existing permissions.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy || loading || Boolean(stateError)}
                          onClick={() => void releaseModule(entry.module)}
                          className="rounded border border-amber-700 px-3 py-2 text-xs text-amber-200 disabled:opacity-50"
                        >
                          Confirm Module Release
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setPendingModule(null)}
                          className="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || loading || Boolean(stateError)}
                      onClick={() => {
                        setReleaseNotice(null);
                        setPendingModule(entry.module);
                      }}
                      className="mt-3 rounded border border-emerald-800 px-3 py-2 text-xs text-emerald-300 disabled:opacity-50"
                    >
                      Review Release · {moduleLabel(entry.module)}
                    </button>
                  )
                ) : null}
                {entry.state === "RELEASED" && ["PREPARING", "CURRENT"].includes(pack.state) &&
                  entry.currentResources.some(resource => resource.state === "WITHHELD") ? (
                  <SelectedCupAdditionsRelease
                    key={pack.id + ":" + entry.module}
                    packageId={pack.id}
                    participantId={participantId}
                    resources={entry.currentResources.filter(resource => resource.state === "WITHHELD")}
                    disabled={busy || loading || Boolean(stateError)}
                    onStart={() => {actionInFlight.current = true; setBusy(true); setPendingModule(null);}}
                    onComplete={async message => {
                      setReleaseNotice(message);
                      try {await reloadPack();}
                      finally {actionInFlight.current = false; setBusy(false);}
                    }}
                  />
                ) : null}
                {entry.currentResources.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500">No current resources.</p>
                ) : entry.currentResources.map((resource) => (
                  <div key={resource.id} className="mt-2 text-xs text-gray-400">
                    <p>{resource.label || resource.resourceId} · {resource.state}</p>
                    <p className="mt-1 text-gray-500">
                      Resource permissions apply after governed release.
                      View: {resource.canView ? "Permitted" : "Withheld"} ·
                      Download: {resource.canDownload ? "Permitted" : "Withheld"} ·
                      Present: {resource.canPresent ? "Permitted" : "Withheld"} ·
                      Transmit: {resource.canTransmit ? "Permitted" : "Withheld"}
                    </p>
                    {resource.state === "RELEASED" &&
                      entry.state === "RELEASED" &&
                      ["PREPARING", "CURRENT"].includes(pack.state) ? (
                      <ResourcePermissionDecision
                        key={participantId + ":" + resource.id}
                        resourceReleaseId={resource.id}
                        participantId={participantId}
                        disabled={busy || loading || Boolean(stateError)}
                        onDecision={reloadPack}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No CUP has been prepared.</p>
        )}
      </div>

      {result ? (
        <div className="mt-4 space-y-3 rounded border border-cyan-900/50 bg-black p-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-500/60">
              Preparation Receipt · {result.created
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
              Release During This Preparation
            </p>

            <p className="mt-1 text-xs font-medium text-gray-300">
              NOT PERFORMED
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy || loading || Boolean(stateError)}
        onClick={() =>
          void preparePack()
        }
        className="mt-4 rounded border border-cyan-700/60 bg-cyan-950/30 px-4 py-2.5 text-sm font-medium text-cyan-200 hover:bg-cyan-950/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? releasingModule
            ? "Releasing " + moduleLabel(releasingModule) + "…"
            : "Preparing CUP…"
          : result
            ? "Prepare / Refresh CUP Again"
            : "Prepare Commercial Utility Pack"}
      </button>
    </section>
  );
}
