"use client";

import { useState, type FormEvent } from "react";

type Agreement = {
  instrumentId: string;
  reference: string;
  status: string;
  candidateEmail: string | null;
};

type StatusResponse =
  | { ok: true; agreement: Agreement }
  | { ok: false; error: string };

type PreparationResponse =
  | { ok: true; agreement: { instrumentId: string; reference: string; created: boolean } }
  | { ok: false; error: string };

export default function RepresentativeMasterAgreementPanel({
  intake,
}: {
  intake: {
    reference: string;
    candidateDisplayName: string;
    candidateEmail: string;
  };
}) {
  const [reference, setReference] = useState(`${intake.reference}-MA`);
  const [title, setTitle] = useState(
    `French-Ward Authorized Commercial Representative Agreement — ${intake.candidateDisplayName}`,
  );
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function readAgreement(): Promise<Agreement | null> {
    const response = await fetch(
      `/api/admin/representative-program/master-agreements/${encodeURIComponent(reference.trim())}`,
      { cache: "no-store" },
    );
    const payload = (await response.json()) as StatusResponse;

    if (response.status === 404) return null;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "Unable to load agreement." : payload.error);
    }
    return payload.agreement;
  }

  async function checkAgreement() {
    setBusy(true);
    setError(null);
    try {
      setAgreement(await readAgreement());
      setChecked(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Agreement lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function prepareAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/representative-program/master-agreements/prepare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            reference: reference.trim(),
            title: title.trim(),
            candidateDisplayName: intake.candidateDisplayName,
            candidateEmail: intake.candidateEmail,
          }),
        },
      );
      const payload = (await response.json()) as PreparationResponse;

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "Unable to prepare agreement." : payload.error);
        return;
      }

      setAgreement(await readAgreement());
      setChecked(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Agreement preparation failed.");
    } finally {
      setBusy(false);
    }
  }

  const signerMatches =
    agreement?.candidateEmail === intake.candidateEmail.trim().toLowerCase();

  return (
    <section className="rounded border border-gray-800 bg-gray-950 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
        Separate Instrument
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">
        Representative Master Agreement
      </h3>
      <p className="mt-2 text-sm text-gray-400">
        Prepare or inspect the agreement record associated with this candidate.
        Preparing it does not record Acrobat execution or admit the candidate.
      </p>

      <form onSubmit={prepareAgreement} className="mt-5 space-y-3">
        <label className="grid gap-2">
          <span className="text-xs text-gray-400">Agreement reference</span>
          <input
            required
            maxLength={101}
            pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,100}"
            value={reference}
            onChange={(event) => {
              setReference(event.target.value);
              setAgreement(null);
              setChecked(false);
            }}
            className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs text-gray-400">Instrument title</span>
          <input
            required
            maxLength={300}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !reference.trim()}
            onClick={() => void checkAgreement()}
            className="rounded border border-gray-600 px-3 py-2 text-sm text-gray-200 disabled:opacity-50"
          >
            Check Reference
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-200 disabled:opacity-50"
          >
            {busy ? "Working…" : "Prepare Agreement Record"}
          </button>
        </div>
      </form>

      {error ? <p role="alert" className="mt-4 text-sm text-red-300">{error}</p> : null}
      {checked && !agreement ? (
        <p role="status" className="mt-4 text-sm text-gray-400">
          No agreement is prepared under this reference.
        </p>
      ) : null}
      {agreement ? (
        <div className="mt-4 rounded border border-gray-700 bg-black p-4 text-sm text-gray-300">
          <p>State: <strong>{agreement.status}</strong></p>
          <p className="mt-1 break-all">Instrument ID: {agreement.instrumentId}</p>
          <p className="mt-1">Designated signer: {agreement.candidateEmail ?? "Missing"}</p>
          {!signerMatches ? (
            <p role="alert" className="mt-3 text-red-300">
              The designated signer does not match this intake. Do not record execution.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
