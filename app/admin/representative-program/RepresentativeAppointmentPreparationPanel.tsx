"use client";
import styles from "./governance-panels.module.css";
import RepresentativeAuthorityPanel from "./RepresentativeAuthorityPanel";
import RepresentativeAppointmentCertificatePanel from "./RepresentativeAppointmentCertificatePanel";

import { useCallback, useEffect, useRef, useState } from "react";

type AppointmentState = {
  appointmentId: string;
  reference: string;
  status: string;
  standing: string;
  effectiveAt: string | null;
  acceptedAt: string | null;
  canActivate: boolean;
};

export default function RepresentativeAppointmentPreparationPanel({
  participantId,
  candidateDisplayName,
}: {
  participantId: string;
  candidateDisplayName: string;
}) {
  const [appointment, setAppointment] = useState<AppointmentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionInFlight = useRef(false);
  const requestSequence = useRef(0);

  const reload = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/representative-program/appointments/state?participantId=${encodeURIComponent(participantId)}`,
        { cache: "no-store" },
      );
      const payload = await response.json() as {
        ok: boolean;
        appointment?: AppointmentState | null;
      };
      if (!response.ok || !payload.ok || !("appointment" in payload)) {
        throw new Error("Unable to load the persisted appointment state.");
      }
      if (sequence === requestSequence.current) {
        setAppointment(payload.appointment ?? null);
        setConfirmed(false);
      }
    } catch {
      if (sequence === requestSequence.current) {
        setError("Unable to load the persisted appointment state. Refresh the record.");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    setAppointment(null);
    setConfirmed(false);
    void reload();
    return () => { requestSequence.current += 1; };
  }, [reload]);

  async function performAction() {
    if (
      actionInFlight.current || loading || error || !confirmed ||
      (appointment && !appointment.canActivate)
    ) return;

    actionInFlight.current = true;
    setBusy(true);
    setError(null);
    const activating = Boolean(appointment);

    try {
      const response = await fetch(
        activating
          ? "/api/admin/representative-program/appointments/activate"
          : "/api/admin/representative-program/appointments/prepare",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(
            appointment
              ? { appointmentId: appointment.appointmentId }
              : { participantId },
          ),
        },
      );
      const payload = await response.json() as { ok: boolean };
      if (!response.ok || !payload.ok) {
        await reload();
        setError(activating
          ? "Activation was not confirmed. Refresh and review the current record."
          : "Preparation was not confirmed. Refresh and review the current record.");
        return;
      }
      await reload();
    } catch {
      await reload();
      setError("The action could not be confirmed. Refresh the record before retrying.");
    } finally {
      setConfirmed(false);
      actionInFlight.current = false;
      setBusy(false);
    }
  }

  const available = !appointment || appointment.canActivate;

  return (
    <section className={styles.appointmentSurface}>
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
        Appointment Instrument
      </p>
      <h3 className="mt-2 text-base font-semibold text-white">
        {appointment ? "Appointment Record" : "Prepare Draft Appointment"}
      </h3>
      <p className="mt-3 text-sm text-gray-400">{candidateDisplayName}</p>

      {loading ? <p className="mt-4 text-sm text-gray-400">Loading persisted record…</p> : null}

      {!loading && appointment ? (
        <div className={styles.recordReadout}>
          <p className="break-words font-mono text-xs text-blue-100">{appointment.reference}</p>
          <dl className={styles.recordGrid}>
            <div>
              <dt className="text-gray-500">Instrument status</dt>
              <dd className="mt-1 text-gray-200">{appointment.status}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Program standing</dt>
              <dd className="mt-1 text-gray-200">{appointment.standing}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Representative acceptance</dt>
              <dd className="mt-1 text-amber-200">
                {appointment.acceptedAt ? "Recorded" : "Pending"}
              </dd>
              {appointment.acceptedAt ? (
                <dd className="mt-1 break-words font-mono text-gray-300">{appointment.acceptedAt}</dd>
              ) : null}
            </div>
            <div>
              <dt className="text-gray-500">Effective date</dt>
              <dd className="mt-1 text-gray-200">{appointment.effectiveAt ?? "Not established"}</dd>
            </div>
          </dl>
          {appointment.canActivate ? (
            <p className="mt-4 text-xs text-amber-200">Awaiting operator activation.</p>
          ) : null}
        </div>
      ) : null}

      {!loading && !appointment && !error ? (
        <p className="mt-4 text-xs leading-6 text-gray-400">
          No appointment has been prepared. Preparation requires a bound,
          executed Master Agreement and provisional Program standing.
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-6 text-gray-500">
        Preparation and representative acceptance precede operator activation.
        Activation establishes the appointment effective date and Active Program
        standing. Delegated authority remains separately governed.
      </p>

      {!loading && !error && available ? (
        <label className={styles.confirmation}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={event => setConfirmed(event.target.checked)}
            disabled={busy}
            className="mt-1 h-4 w-4 accent-amber-500"
          />
          <span className="text-xs leading-5 text-amber-100/80">
            {appointment
              ? "I confirm operator activation of this accepted appointment and the transition to Active Program standing. This action creates no delegated authority."
              : "I confirm preparation of a draft appointment. Preparation does not activate the appointment or create authority."}
          </span>
        </label>
      ) : null}

      {error ? <p role="alert" className="mt-4 text-sm text-red-300">{error}</p> : null}

      <div className={styles.appointmentActions}>
        {!loading && !error && available ? (
          <button
            type="button"
            disabled={busy || !confirmed}
            onClick={() => void performAction()}
            className="rounded border border-blue-500/40 px-4 py-3 text-sm text-blue-200 disabled:opacity-50"
          >
            {busy ? "Recording…" : appointment ? "Activate Appointment" : "Prepare Appointment Instrument"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => void reload()}
          className="rounded border border-gray-700 px-4 py-3 text-sm text-gray-300 disabled:opacity-50"
        >
          Refresh Record
        </button>
      </div>
      {!loading && !error && appointment?.status === "ACTIVE" ? (
        <RepresentativeAppointmentCertificatePanel
          key={appointment.appointmentId}
          appointmentId={appointment.appointmentId}
        />
      ) : null}
      {appointment ? (
        <RepresentativeAuthorityPanel
          key={appointment.appointmentId + appointment.status}
          appointmentId={appointment.appointmentId}
        />
      ) : null}
    </section>
  );
}
