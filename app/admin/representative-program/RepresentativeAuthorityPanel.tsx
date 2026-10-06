"use client";

import { useEffect, useRef, useState } from "react";

type Entry = {
  key: string;
  title: string;
  exercisable: boolean;
  reason: string;
  authority: {
    id: string;
    authorityClass: string;
    action: string;
    conditions: unknown;
    effectiveAt: string;
    expiresAt: string | null;
  } | null;
};

type Draft =
  | { decision: "RECORD"; entry: Entry; effectiveAt: string }
  | { decision: "REVOKE"; entry: Entry };

export default function RepresentativeAuthorityPanel({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [stateError, setStateError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [authorityClass, setAuthorityClass] = useState("");
  const [action, setAction] = useState("");
  const [conditions, setConditions] = useState("");
  const [expiry, setExpiry] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setStateError(false);
    setDraft(null);
    setConfirmed(false);

    async function load() {
      try {
        const response = await fetch(
          `/api/admin/representative-program/authorities/state?appointmentId=${encodeURIComponent(appointmentId)}`,
          { cache: "no-store" },
        );
        const payload = await response.json() as {
          ok: boolean;
          register?: { entries: Entry[] };
        };
        if (!response.ok || !payload.ok || !payload.register) throw new Error();
        if (!cancelled) setEntries(payload.register.entries);
      } catch {
        if (!cancelled) setStateError(true);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [appointmentId, revision]);

  function begin(entry: Entry, decision: "RECORD" | "REVOKE") {
    setDraft(decision === "RECORD"
      ? { decision, entry, effectiveAt: new Date().toISOString() }
      : { decision, entry });
    setAuthorityClass("");
    setAction("");
    setConditions(JSON.stringify({
      requiresPriorApproval: true,
      approvalAuthority: "French-Ward operator",
      allowWhileRestricted: false,
      notes: "",
    }, null, 2));
    setExpiry("");
    setConfirmed(false);
    setMessage("");
  }

  async function submit() {
    if (!draft || !confirmed || inFlight.current || !entries || stateError) return;

    let body: Record<string, unknown>;
    try {
      body = {
        decision: draft.decision,
        appointmentId,
        authorityKey: draft.entry.key,
        confirmDecision: true,
      };
      if (draft.decision === "RECORD") {
        const parsed: unknown = JSON.parse(conditions);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error();
        }
        body = {
          ...body,
          authorityClass,
          action: action.trim(),
          conditions: parsed,
          effectiveAt: draft.effectiveAt,
          expiresAt: expiry ? new Date(expiry).toISOString() : null,
        };
      } else {
        if (!draft.entry.authority) throw new Error();
        body.expectedAuthorityId = draft.entry.authority.id;
      }
    } catch {
      setMessage("Check the conditions object and expiry before confirming.");
      return;
    }

    inFlight.current = true;
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/representative-program/authorities/decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json() as {
        ok: boolean;
        result?: { changed: boolean };
      };
      if (!response.ok || !payload.ok) {
        setMessage(response.status === 409
          ? "Decision blocked: refresh and review the current record and appointment."
          : "Decision could not be confirmed. Review the refreshed register before retrying.");
      } else {
        setMessage(payload.result?.changed
          ? "Authority decision recorded. Register refreshed below."
          : "This decision was already recorded. Register refreshed below.");
      }
    } catch {
      setMessage("Response unavailable. Review the refreshed register before retrying.");
    } finally {
      setDraft(null);
      setConfirmed(false);
      setRevision(value => value + 1);
      setBusy(false);
      inFlight.current = false;
    }
  }

  const inputClass =
    "mt-2 w-full rounded border border-gray-700 bg-gray-950 p-2 text-xs text-gray-200";

  return (
    <section className="mt-6 border-t border-gray-800 pt-5">
      <h4 className="text-sm font-semibold text-amber-200">Authority Register</h4>
      <p className="mt-3 text-xs leading-6 text-gray-400">
        Each authority requires a separate operator decision.
        Exercisability reflects lifecycle checks; recorded scope, conditions,
        and required approvals apply to every action.
      </p>

      {message ? <p role="status" className="mt-3 text-xs text-amber-200">{message}</p> : null}
      {stateError ? <p role="alert" className="mt-3 text-xs text-red-300">Authority state unavailable.</p> : null}
      {!entries && !stateError ? <p className="mt-3 text-xs text-gray-500">Loading authority register…</p> : null}

      <div className="mt-4 space-y-3">
        {entries?.map(entry => (
          <article key={entry.key} className="rounded border border-gray-800 p-3">
            <p className="text-xs font-medium text-gray-200">{entry.title}</p>
            <p className="mt-2 text-xs text-amber-200">
              {entry.authority?.authorityClass ?? "NO OPERATIVE RECORD"}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              {entry.exercisable ? "Exercisable within conditions" : "Not exercisable"} · {entry.reason.replaceAll("_", " ").toLowerCase()}
            </p>
            {entry.authority ? (
              <>
                <p className="mt-2 text-xs text-gray-300">{entry.authority.action}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Effective: {entry.authority.effectiveAt} ·
                  Expires: {entry.authority.expiresAt ?? "No recorded expiry"}
                </p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-gray-400">
                  {JSON.stringify(entry.authority.conditions ?? {}, null, 2)}
                </pre>
              </>
            ) : null}

            <button
              type="button"
              disabled={busy || stateError || draft !== null}
              onClick={() => begin(entry, entry.authority ? "REVOKE" : "RECORD")}
              className="mt-3 rounded border border-gray-700 px-3 py-2 text-xs text-amber-200 disabled:opacity-40"
            >
              {entry.authority ? "Review Revocation" : "Review Authority Recording"}
            </button>

            {draft?.entry.key === entry.key ? (
              <form className="mt-4 space-y-3 border-t border-gray-800 pt-4"
                onSubmit={event => { event.preventDefault(); void submit(); }}>
                <p className="text-xs font-semibold text-amber-200">
                  {draft.decision === "RECORD" ? "Record Authority" : "Revoke Displayed Authority"}
                </p>

                {draft.decision === "RECORD" ? (
                  <fieldset disabled={busy} className="space-y-3">
                    <label className="block text-xs text-gray-400">
                      Disposition
                      <select required value={authorityClass}
                        onChange={event => { setAuthorityClass(event.target.value); setConfirmed(false); }}
                        className={inputClass}>
                        <option value="">Select disposition</option>
                        <option value="RESERVED">Reserved to principal</option>
                        <option value="DELEGATED">Delegated to representative</option>
                        <option value="JOINT">Joint authority</option>
                        <option value="PROHIBITED">Prohibited</option>
                      </select>
                    </label>
                    <label className="block text-xs text-gray-400">
                      Exact permitted or governed action
                      <textarea required maxLength={2000} value={action} rows={3}
                        onChange={event => { setAction(event.target.value); setConfirmed(false); }}
                        className={inputClass} />
                    </label>
                    <label className="block text-xs text-gray-400">
                      Conditions — include nonempty notes defining the boundary
                      <textarea required value={conditions} rows={8}
                        onChange={event => { setConditions(event.target.value); setConfirmed(false); }}
                        className={`${inputClass} font-mono`} />
                    </label>
                    <label className="block text-xs text-gray-400">
                      Expiry, local time — required if the appointment has an expiry
                      <input type="datetime-local" value={expiry}
                        onChange={event => { setExpiry(event.target.value); setConfirmed(false); }}
                        className={inputClass} />
                    </label>
                    <p className="text-xs text-gray-500">
                      Effective: {draft.effectiveAt}
                    </p>
                  </fieldset>
                ) : (
                  <p className="text-xs leading-6 text-gray-400">
                    This revokes the displayed record. Appointment, Program standing,
                    and CUP resource permissions remain separately governed.
                  </p>
                )}

                <label className="flex items-start gap-2 text-xs leading-6 text-gray-300">
                  <input type="checkbox" required checked={confirmed} disabled={busy}
                    onChange={event => setConfirmed(event.target.checked)} className="mt-1" />
                  I reviewed this exact authority decision and confirm it.
                </label>

                <div className="flex gap-3">
                  <button type="submit" disabled={busy || !confirmed}
                    className="rounded border border-amber-700 px-3 py-2 text-xs text-amber-200 disabled:opacity-40">
                    {busy ? "Recording Decision…" : draft.decision === "RECORD"
                      ? "Confirm Authority Recording" : "Confirm Revocation"}
                  </button>
                  <button type="button" disabled={busy}
                    onClick={() => { setDraft(null); setConfirmed(false); }}
                    className="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300">
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </article>
        ))}
      </div>

      <button type="button" disabled={busy}
        onClick={() => setRevision(value => value + 1)}
        className="mt-4 rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 disabled:opacity-40">
        Refresh Authority Register
      </button>
    </section>
  );
}
