"use client";

import { useState } from "react";

type PreparationResponse =
  | {
      ok: true;
      appointment: {
        instrumentId: string;
        appointmentId: string;
        reference: string;
        appointmentClass: string;
        appointmentForm: string;
        masterAgreementInstrumentId: string;
        masterAgreementReference: string;
        created: boolean;
      };
      authority: {
        created: false;
        status: "NOT_CREATED";
      };
      activation: {
        performed: false;
      };
    }
  | {
      ok: false;
      error: string;
    };

export default function RepresentativeAppointmentPreparationPanel({
  participantId,
  candidateDisplayName,
}: {
  participantId: string;
  candidateDisplayName: string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    Extract<PreparationResponse, { ok: true }>["appointment"] | null
  >(null);

  async function prepareAppointment() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/representative-program/appointments/prepare",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            participantId,
          }),
        },
      );

      const payload = (await response.json()) as PreparationResponse;

      if (!response.ok || !payload.ok) {
        setError(
          payload.ok
            ? "Unable to prepare the Appointment Instrument."
            : payload.error,
        );
        return;
      }

      setResult(payload.appointment);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Appointment preparation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded border border-gray-800 bg-black p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Appointment Instrument
          </p>

          <h3 className="mt-2 text-base font-semibold text-white">
            Prepare Draft Appointment
          </h3>
        </div>

        <span className="rounded border border-gray-700 bg-gray-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Preparation Only
        </span>
      </div>

      <p className="mt-3 text-sm leading-5 text-gray-400">
        Prepare the draft appointment instrument for{" "}
        <strong className="text-gray-200">{candidateDisplayName}</strong>.
        Preparation does not activate the appointment or create delegated
        authority.
      </p>

      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded border border-gray-800 bg-gray-950 p-3">
          <dt className="text-gray-500">Appointment Form</dt>
          <dd className="mt-1 font-mono text-gray-200">
            INDIVIDUAL_REPRESENTATION
          </dd>
        </div>

        <div className="rounded border border-gray-800 bg-gray-950 p-3">
          <dt className="text-gray-500">Appointment Class</dt>
          <dd className="mt-1 font-mono text-gray-200">
            AUTHORIZED_COMMERCIAL_REPRESENTATIVE
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded border border-gray-800 bg-gray-950 p-3">
        <p className="text-xs leading-5 text-gray-500">
          Participant remains{" "}
          <strong className="text-gray-300">PROVISIONAL</strong>. The server
          requires the bound Master Agreement to be EXECUTED before preparation
          can succeed.
        </p>
      </div>

      <label className="mt-4 flex items-start gap-3 rounded border border-amber-800/40 bg-amber-950/10 p-3">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={busy}
          className="mt-1 h-4 w-4 accent-amber-500"
        />

        <span className="text-xs leading-5 text-amber-100/80">
          I understand this action prepares a DRAFT appointment only. It does
          not activate the appointment or create authority.
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded border border-blue-800/50 bg-blue-950/20 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-400/70">
            {result.created
              ? "Appointment Prepared"
              : "Existing Draft Returned"}
          </p>

          <p className="mt-2 font-mono text-xs text-blue-100">
            {result.reference}
          </p>

          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-blue-300/50">State</dt>
              <dd className="mt-1 text-blue-100">DRAFT</dd>
            </div>

            <div>
              <dt className="text-blue-300/50">Authority</dt>
              <dd className="mt-1 text-blue-100">NOT CREATED</dd>
            </div>

            <div>
              <dt className="text-blue-300/50">Activation</dt>
              <dd className="mt-1 text-blue-100">NOT PERFORMED</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy || !confirmed}
        onClick={() => void prepareAppointment()}
        className="mt-4 rounded border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-200 hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? "Preparing Appointment…"
          : result
            ? "Prepare / Verify Draft Again"
            : "Prepare Appointment Instrument"}
      </button>
    </section>
  );
}
