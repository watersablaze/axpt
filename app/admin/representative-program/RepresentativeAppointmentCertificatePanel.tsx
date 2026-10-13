"use client";
import { useEffect, useRef, useState } from "react";

type Review = {
  basisHash: string;
  configuration: {
    displayName: string;
    reference: string;
    version: number;
    effectiveAt: string;
    authorities: Array<{ id: string; key: string; action: string; conditions: unknown; effectiveAt: string; expiresAt: string | null }>;
  };
};

export default function RepresentativeAppointmentCertificatePanel({
  appointmentId,
}: { appointmentId: string }) {
  const [review, setReview] = useState<Review | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const inFlight = useRef(false);
  const sequence = useRef(0);

  useEffect(() => () => { sequence.current += 1; }, []);

  async function inspect() {
    if (inFlight.current) return;
    const current = ++sequence.current;
    inFlight.current = true;
    setBusy(true);
    setConfirmed(false);
    setReview(null);
    setReceipt(null);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/representative-program/appointments/credential?appointmentId=${encodeURIComponent(appointmentId)}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.review) {
        throw new Error("Certificate review unavailable.");
      }
      if (current === sequence.current) setReview(payload.review);
    } catch {
      if (current === sequence.current) {
        setError("Certificate review is unavailable. Issuance requires the authorized signatory account and an eligible appointment.");
      }
    } finally {
      inFlight.current = false;
      if (current === sequence.current) setBusy(false);
    }
  }

  async function issue() {
    if (inFlight.current || !review || !confirmed) return;
    const current = ++sequence.current;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/admin/representative-program/appointments/credential", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            expectedBasisHash: review.basisHash,
            confirmIssue: true,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.issuance) {
        throw new Error("Issuance not confirmed.");
      }
      if (current === sequence.current) {
        setReceipt(`${payload.issuance.issued
          ? "Certificate issued" : "Existing issuance confirmed"} · ${payload.issuance.issuedAt}`);
        setReview(null);
      }
    } catch {
      if (current === sequence.current) {
        setReview(null);
        setError("Issuance could not be confirmed. Review again before retrying; an exact retry preserves an existing issuance.");
      }
    } finally {
      inFlight.current = false;
      if (current === sequence.current) {
        setConfirmed(false);
        setBusy(false);
      }
    }
  }

  return (
    <section className="mt-5 border-t border-gray-800 pt-5">
      <h4 className="text-sm font-semibold text-amber-100">
        Certificate of Appointment
      </h4>
      <p className="mt-2 text-xs leading-6 text-gray-400">
        Issue the sealed certificate under Jamal James Ward’s signature.
        Issuance preserves the PDF and its recorded authority snapshot.
        Review the actions and conditions below; they are published with the credential.
      </p>
      <button type="button" disabled={busy} onClick={() => void inspect()}
        className="mt-3 rounded border border-gray-700 px-3 py-2 text-xs text-gray-200 disabled:opacity-50">
        {busy ? "Processing…" : "Review Certificate Issuance"}
      </button>

      {review ? (
        <div className="mt-4 border border-amber-800/40 p-4">
          <p className="text-sm text-white">{review.configuration.displayName}</p>
          <p className="mt-2 break-words font-mono text-xs text-gray-300">
            {review.configuration.reference} · Version {review.configuration.version}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Effective: {review.configuration.effectiveAt}
          </p>
          <div className="mt-3 space-y-3">
            {review.configuration.authorities.map(authority => <div key={authority.id}>
              <p className="text-xs font-semibold text-amber-100">{authority.key}</p>
              <p className="text-xs leading-6 text-gray-200">{authority.action}</p>
              <dl className="mt-1 text-xs leading-6 text-gray-400">
                {authority.conditions && typeof authority.conditions === "object"
                  ? Object.entries(authority.conditions).map(([key, value]) => <div key={key}>
                    <dt className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}</dt>
                    <dd className="break-words">{Array.isArray(value) ? value.join(", ")
                      : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd>
                  </div>) : <div><dt>Additional conditions</dt><dd>None recorded</dd></div>}
              </dl>
              <p className="text-xs text-gray-400">Authority effective: {authority.effectiveAt} · Expiry: {authority.expiresAt ?? "Not recorded"}</p>
            </div>)}
          </div>
          <label className="mt-4 flex items-start gap-3 text-xs leading-6 text-amber-100">
            <input type="checkbox" checked={confirmed} disabled={busy}
              onChange={event => setConfirmed(event.target.checked)}
              className="mt-1" />
            I authorize issuance of this appointment certificate with
            Jamal James Ward’s signature and the French-Ward seal, including
            publication of the reviewed actions and conditions.
          </label>
          <button type="button" disabled={busy || !confirmed}
            onClick={() => void issue()}
            className="mt-3 rounded border border-amber-700 px-3 py-2 text-xs text-amber-100 disabled:opacity-40">
            Confirm Certificate Issuance
          </button>
        </div>
      ) : null}
      {receipt ? <p role="status" className="mt-3 text-xs text-green-200">{receipt}</p> : null}
      {error ? <p role="alert" className="mt-3 text-xs text-red-300">{error}</p> : null}
    </section>
  );
}
