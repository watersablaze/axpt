"use client";

import { useState } from "react";

type Props = {
  dossierId: string;
  origin: string | null;
  refinery: string | null;
  settlement: string | null;
  onSourceChanged?: () => void;
};

type PatchResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
};

function toInputValue(value: string | null | undefined) {
  return value ?? "";
}

function normalizeInput(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

async function readJsonResponse(response: Response): Promise<PatchResponse> {
  const text = await response.text();

  if (!text.trim()) {
    return {
      ok: false,
      error: `EMPTY_RESPONSE_${response.status}`,
    };
  }

  try {
    return JSON.parse(text) as PatchResponse;
  } catch {
    return {
      ok: false,
      error: `INVALID_JSON_RESPONSE_${response.status}`,
      message: text.slice(0, 180),
    };
  }
}

export function DossierSourceContextPanel({
  dossierId,
  origin,
  refinery,
  settlement,
  onSourceChanged,
}: Props) {
  const [draft, setDraft] = useState({
    origin: toInputValue(origin),
    refinery: toInputValue(refinery),
    settlement: toInputValue(settlement),
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveSourceContext() {
    setSaving(true);
    setError(null);
    setSavedAt(null);

    try {
      const response = await fetch(
        `/api/admin/control-center/dossiers/${dossierId}`,
        {
          method: "PATCH",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: normalizeInput(draft.origin),
            refinery: normalizeInput(draft.refinery),
            settlement: normalizeInput(draft.settlement),
          }),
        },
      );

      const data = await readJsonResponse(response);

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ?? data.error ?? "Unable to update source context.",
        );
      }

      setSavedAt(new Date().toLocaleTimeString());
      onSourceChanged?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update source context.",
      );
    } finally {
      setSaving(false);
    }
  }

  const originReady = Boolean(draft.origin.trim());

  return (
    <section className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Dossier Source Context
          </div>

          <h3 className="mt-1 text-sm font-medium text-white">
            Origin, refinery, and settlement context
          </h3>

          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-500">
            These fields feed document rendering and execution gates. Origin is
            required before SPA execution.
          </p>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
            originReady
              ? "border-emerald-800 text-emerald-300"
              : "border-red-900 text-red-300"
          }`}
        >
          Origin {originReady ? "Ready" : "Missing"}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded border border-red-900 bg-red-950/20 p-2 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {savedAt ? (
        <div className="mt-3 rounded border border-emerald-900 bg-emerald-950/20 p-2 text-xs text-emerald-300">
          Source context saved at {savedAt}.
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Origin
          </span>
          <input
            value={draft.origin}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                origin: event.target.value,
              }))
            }
            placeholder="Mali, Guinea, Ghana..."
            className="w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Refinery
          </span>
          <input
            value={draft.refinery}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                refinery: event.target.value,
              }))
            }
            placeholder="Refinery / assay location..."
            className="w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Settlement
          </span>
          <input
            value={draft.settlement}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                settlement: event.target.value,
              }))
            }
            placeholder="Escrow, MT103, crypto, refinery..."
            className="w-full rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => void saveSourceContext()}
        className="mt-3 rounded border border-cyan-900 bg-cyan-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-700 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:text-neutral-600"
      >
        {saving ? "Saving..." : "Save source context"}
      </button>
    </section>
  );
}
