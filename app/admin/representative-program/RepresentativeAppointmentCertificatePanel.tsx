"use client";
import { useEffect, useRef, useState } from "react";

type Review = {
  basisHash: string;
  configuration: {
    displayName: string;
    reference: string;
    version: number;
    effectiveAt: string;
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
        Issuance preserves the PDF and records its evidence. Delegated
        authority remains separately governed.
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
          <label className="mt-4 flex items-start gap-3 text-xs leading-6 text-amber-100">
            <input type="checkbox" checked={confirmed} disabled={busy}
              onChange={event => setConfirmed(event.target.checked)}
              className="mt-1" />
            I authorize issuance of this appointment certificate with
            Jamal James Ward’s signature and the French-Ward seal.
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
