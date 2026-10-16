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
  | {
      ok: true;
      agreement: {
        instrumentId: string;
        reference: string;
        created: boolean;
      };
    }
  | { ok: false; error: string };

type ExecutionResponse =
  | {
      ok: true;
      agreement: {
        instrumentId: string;
        reference: string;
        executed: boolean;
      };
    }
  | { ok: false; error: string };

type AdmissionResponse =
  | {
      ok: true;
      intakeId: string;
      participant: {
        id: string;
        docketReference: string;
        standing: string;
        created: boolean;
      };
      agreement: {
        instrumentId: string;
        bound: boolean;
      };
    }
  | { ok: false; error: string };

const MAX_EXECUTION_PACKAGE_BYTES = 4_000_000;

export default function RepresentativeMasterAgreementPanel({
  intake,
  onChanged,
}: {
  intake: {
    id: string;
    reference: string;
    candidateDisplayName: string;
    candidateEmail: string;
    status: string;
    admittedParticipantId: string | null;
    masterAgreementInstrumentId: string | null;
  };
  onChanged?: () => Promise<void>;
}) {
  const [reference, setReference] = useState(`${intake.reference}-MA`);
  const [title, setTitle] = useState(
    `French-Ward Authorized Commercial Representative Agreement — ${intake.candidateDisplayName}`,
  );

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [executionBusy, setExecutionBusy] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const [admissionBusy, setAdmissionBusy] = useState(false);
  const [admissionError, setAdmissionError] = useState<string | null>(null);
  const [admissionMessage, setAdmissionMessage] = useState<string | null>(null);

  async function readAgreement(): Promise<Agreement | null> {
    const response = await fetch(
      `/api/admin/representative-program/master-agreements/${encodeURIComponent(
        reference.trim(),
      )}`,
      {
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as StatusResponse;

    if (response.status === 404) {
      return null;
    }

    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "Unable to load agreement." : payload.error);
    }

    return payload.agreement;
  }

  async function checkAgreement() {
    setBusy(true);
    setError(null);
    setExecutionError(null);
    setExecutionMessage(null);

    try {
      setAgreement(await readAgreement());
      setChecked(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Agreement lookup failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function prepareAgreement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError(null);
    setExecutionError(null);
    setExecutionMessage(null);

    try {
      const response = await fetch(
        "/api/admin/representative-program/master-agreements/prepare",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
      setError(
        cause instanceof Error
          ? cause.message
          : "Agreement preparation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function recordExecution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setExecutionBusy(true);
    setExecutionError(null);
    setExecutionMessage(null);

    try {
      if (!agreement) {
        setExecutionError(
          "Prepare or load the Master Agreement before recording execution.",
        );
        return;
      }

      const expectedSigner = intake.candidateEmail.trim().toLowerCase();

      if (agreement.candidateEmail !== expectedSigner) {
        setExecutionError(
          "The designated signer does not match this candidate intake.",
        );
        return;
      }

      if (agreement.status !== "DRAFT") {
        setExecutionError(
          `Execution evidence cannot be recorded from agreement state ${agreement.status}.`,
        );
        return;
      }

      const submitted = new FormData(event.currentTarget);

      const adobeAgreementId = String(
        submitted.get("adobeAgreementId") ?? "",
      ).trim();

      const completedAtInput = String(
        submitted.get("completedAt") ?? "",
      ).trim();

      const signedPdf = submitted.get("signedPdf");
      const auditPdf = submitted.get("auditPdf");

      const operatorConfirmedAllSignatures =
        submitted.get("operatorConfirmedAllSignatures") === "on";

      if (!adobeAgreementId || !completedAtInput) {
        setExecutionError(
          "Adobe Agreement ID and completion time are required.",
        );
        return;
      }

      if (!(signedPdf instanceof File) || !(auditPdf instanceof File)) {
        setExecutionError(
          "Both the executed Agreement PDF and Acrobat audit PDF are required.",
        );
        return;
      }

      if (signedPdf.size === 0 || auditPdf.size === 0) {
        setExecutionError("Execution evidence files cannot be empty.");
        return;
      }

      if (signedPdf.size + auditPdf.size > MAX_EXECUTION_PACKAGE_BYTES) {
        setExecutionError(
          "The combined execution evidence package must not exceed 4 MB.",
        );
        return;
      }

      if (!operatorConfirmedAllSignatures) {
        setExecutionError(
          "Operator signature review confirmation is required.",
        );
        return;
      }

      const completedAt = new Date(completedAtInput);

      if (!Number.isFinite(completedAt.getTime())) {
        setExecutionError("The Acrobat completion time is invalid.");
        return;
      }

      const body = new FormData();

      body.set("reference", agreement.reference);
      body.set("signerEmail", expectedSigner);
      body.set("adobeAgreementId", adobeAgreementId);
      body.set("completedAt", completedAt.toISOString());
      body.set("operatorConfirmedAllSignatures", "true");
      body.set("signedPdf", signedPdf);
      body.set("auditPdf", auditPdf);

      const response = await fetch(
        "/api/admin/representative-program/master-agreements/execute",
        {
          method: "POST",
          cache: "no-store",
          body,
        },
      );

      const payload = (await response.json()) as ExecutionResponse;

      if (!response.ok || !payload.ok) {
        setExecutionError(
          payload.ok ? "Unable to record execution." : payload.error,
        );
        return;
      }

      const refreshed = await readAgreement();

      if (!refreshed) {
        setExecutionError(
          "Execution was recorded, but the agreement could not be reloaded.",
        );
        return;
      }

      setAgreement(refreshed);

      setExecutionMessage(
        payload.agreement.executed
          ? "Execution evidence recognized. Master Agreement is now EXECUTED."
          : "Execution evidence was already recognized.",
      );
    } catch (cause) {
      setExecutionError(
        cause instanceof Error
          ? cause.message
          : "Master Agreement execution recording failed.",
      );
    } finally {
      setExecutionBusy(false);
    }
  }

  async function admitAndBind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAdmissionBusy(true);
    setAdmissionError(null);
    setAdmissionMessage(null);

    try {
      if (!agreement) {
        setAdmissionError(
          "Load the executed Master Agreement before recording admission.",
        );
        return;
      }

      if (agreement.status !== "EXECUTED") {
        setAdmissionError(
          "Program admission requires an EXECUTED Master Agreement.",
        );
        return;
      }

      if (
        agreement.candidateEmail !== intake.candidateEmail.trim().toLowerCase()
      ) {
        setAdmissionError(
          "The executed Master Agreement signer does not match this intake.",
        );
        return;
      }

      if (intake.status !== "QUALIFIED") {
        setAdmissionError(
          `Admission cannot be recorded from intake state ${intake.status}.`,
        );
        return;
      }

      const submitted = new FormData(event.currentTarget);

      if (submitted.get("operatorConfirmedAdmission") !== "on") {
        setAdmissionError(
          "Explicit Program admission confirmation is required.",
        );
        return;
      }

      const response = await fetch(
        `/api/admin/representative-program/intakes/${encodeURIComponent(
          intake.id,
        )}/admit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            decision: "ADMIT_AND_BIND",
            instrumentReference: agreement.reference,
          }),
        },
      );

      const payload = (await response.json()) as AdmissionResponse;

      if (!response.ok || !payload.ok) {
        setAdmissionError(
          payload.ok ? "Unable to record Program admission." : payload.error,
        );
        return;
      }

      setAdmissionMessage(
        `Program admission recorded. Participant ${payload.participant.docketReference} established at ${payload.participant.standing} standing and Master Agreement bound.`,
      );

      if (onChanged) {
        await onChanged();
      }
    } catch (cause) {
      setAdmissionError(
        cause instanceof Error
          ? cause.message
          : "Program admission and agreement binding failed.",
      );
    } finally {
      setAdmissionBusy(false);
    }
  }

  const signerMatches =
    agreement?.candidateEmail === intake.candidateEmail.trim().toLowerCase();

  const agreementBound =
    Boolean(agreement) &&
    intake.masterAgreementInstrumentId === agreement?.instrumentId;

  return (
    <section className="rounded border border-gray-800 bg-gray-950 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
        Separate Instrument
      </p>

      <h3 className="mt-2 text-lg font-semibold text-white">
        Representative Master Agreement
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-400">
        Prepare or inspect the agreement record associated with this candidate.
        Agreement preparation, external execution, Program admission,
        appointment, and delegated authority remain separate governed facts.
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
              setExecutionError(null);
              setExecutionMessage(null);
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

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {checked && !agreement ? (
        <p role="status" className="mt-4 text-sm text-gray-400">
          No agreement is prepared under this reference.
        </p>
      ) : null}

      {agreement ? (
        <div className="mt-4 rounded border border-gray-700 bg-black p-4 text-sm text-gray-300">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p>
                State:{" "}
                <strong className="text-white">{agreement.status}</strong>
              </p>

              <p className="mt-1 break-all">
                Instrument ID: {agreement.instrumentId}
              </p>

              <p className="mt-1">
                Designated signer: {agreement.candidateEmail ?? "Missing"}
              </p>
            </div>

            <span
              className={
                signerMatches
                  ? "rounded border border-emerald-800/60 bg-emerald-950/30 px-2 py-1 text-xs text-emerald-300"
                  : "rounded border border-red-800/60 bg-red-950/30 px-2 py-1 text-xs text-red-300"
              }
            >
              {signerMatches ? "Signer Matched" : "Signer Mismatch"}
            </span>
          </div>

          {!signerMatches ? (
            <p role="alert" className="mt-3 text-red-300">
              The designated signer does not match this intake. Do not record
              execution.
            </p>
          ) : null}
        </div>
      ) : null}

      {agreement && signerMatches && agreement.status === "DRAFT" ? (
        <div className="mt-5 border-t border-gray-800 pt-5">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Execution Evidence
          </p>

          <h4 className="mt-2 text-base font-semibold text-white">
            Recognize External Acrobat Execution
          </h4>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Record the externally completed Agreement only after operator
            review. AXPT stores the executed PDF and the distinct Acrobat audit
            trail privately, then records their hashes and execution evidence
            against this instrument.
          </p>

          <form onSubmit={recordExecution} className="mt-5 space-y-4">
            <label className="grid gap-2">
              <span className="text-xs text-gray-400">Designated signer</span>

              <input
                readOnly
                value={intake.candidateEmail.trim().toLowerCase()}
                className="rounded border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs text-gray-400">Adobe Agreement ID</span>

              <input
                name="adobeAgreementId"
                required
                maxLength={200}
                autoComplete="off"
                className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs text-gray-400">
                Acrobat completion date / time
              </span>

              <input
                name="completedAt"
                type="datetime-local"
                required
                className="rounded border border-gray-700 bg-black px-3 py-2 text-white"
              />

              <span className="text-xs leading-5 text-gray-500">
                Use the completion timestamp shown by the external execution
                record.
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-xs text-gray-400">
                Executed Agreement PDF
              </span>

              <input
                name="signedPdf"
                type="file"
                accept="application/pdf,.pdf"
                required
                className="rounded border border-gray-700 bg-black px-3 py-2 text-sm text-gray-300 file:mr-3 file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-xs file:text-gray-200"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs text-gray-400">Acrobat audit PDF</span>

              <input
                name="auditPdf"
                type="file"
                accept="application/pdf,.pdf"
                required
                className="rounded border border-gray-700 bg-black px-3 py-2 text-sm text-gray-300 file:mr-3 file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-xs file:text-gray-200"
              />

              <span className="text-xs leading-5 text-gray-500">
                This must be a distinct audit / execution record, not a
                duplicate of the signed Agreement. Combined package limit: 4 MB.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded border border-amber-800/40 bg-amber-950/10 p-3">
              <input
                name="operatorConfirmedAllSignatures"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 accent-amber-500"
              />

              <span className="text-xs leading-5 text-amber-100/80">
                I have reviewed the executed Agreement and external Acrobat
                record and confirm that all required signatures are present.
              </span>
            </label>

            {executionError ? (
              <p
                role="alert"
                className="rounded border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-300"
              >
                {executionError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={executionBusy}
              className="rounded border border-emerald-700/50 bg-emerald-950/30 px-4 py-2.5 text-sm font-medium text-emerald-200 disabled:opacity-50"
            >
              {executionBusy
                ? "Recording Execution…"
                : "Record Reviewed Execution"}
            </button>
          </form>
        </div>
      ) : null}

      {agreement && signerMatches && agreement.status === "EXECUTED" ? (
        <div className="mt-5 rounded border border-emerald-800/50 bg-emerald-950/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-400/70">
            Execution Recognized
          </p>

          <p className="mt-2 text-sm leading-6 text-emerald-100/80">
            The Master Agreement is recorded as externally executed. This
            execution does not itself admit the candidate, create an
            appointment, or grant delegated authority.
          </p>
        </div>
      ) : null}

      {agreement &&
      signerMatches &&
      agreement.status === "EXECUTED" &&
      intake.status === "QUALIFIED" ? (
        <div className="mt-5 border-t border-gray-800 pt-5">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400/70">
            Program Admission
          </p>

          <h4 className="mt-2 text-base font-semibold text-white">
            Admit Candidate + Bind Executed Agreement
          </h4>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Admission is a separate institutional decision. This operation
            atomically creates the canonical Program Participant at PROVISIONAL
            standing and binds this executed Master Agreement. It does not
            create an Appointment Instrument, Authority Schedule, transaction
            authority, or delegated authority.
          </p>

          <form onSubmit={admitAndBind} className="mt-4 space-y-4">
            <div className="rounded border border-gray-800 bg-black p-3 text-xs leading-5 text-gray-400">
              <p>
                Candidate:{" "}
                <strong className="text-gray-200">
                  {intake.candidateDisplayName}
                </strong>
              </p>
              <p className="mt-1">
                Agreement:{" "}
                <strong className="text-gray-200">{agreement.reference}</strong>
              </p>
              <p className="mt-1">
                Initial standing:{" "}
                <strong className="text-amber-200">PROVISIONAL</strong>
              </p>
            </div>

            <label className="flex items-start gap-3 rounded border border-amber-800/40 bg-amber-950/10 p-3">
              <input
                name="operatorConfirmedAdmission"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 accent-amber-500"
              />

              <span className="text-xs leading-5 text-amber-100/80">
                I am recording a separate Program admission decision. I
                understand that admission establishes Program participation at
                PROVISIONAL standing and binds the executed Master Agreement,
                but does not create appointment or delegated authority.
              </span>
            </label>

            {admissionError ? (
              <p
                role="alert"
                className="rounded border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-300"
              >
                {admissionError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={admissionBusy}
              className="rounded border border-amber-600/50 bg-amber-950/30 px-4 py-2.5 text-sm font-medium text-amber-100 disabled:opacity-50"
            >
              {admissionBusy
                ? "Recording Admission…"
                : "Admit to Program + Bind Agreement"}
            </button>
          </form>
        </div>
      ) : null}

      {agreement &&
      signerMatches &&
      agreement.status === "EXECUTED" &&
      intake.status === "ADMITTED" ? (
        <div
          className={
            agreementBound
              ? "mt-5 rounded border border-blue-800/50 bg-blue-950/20 p-4"
              : "mt-5 rounded border border-red-800/50 bg-red-950/20 p-4"
          }
        >
          <p className="text-xs uppercase tracking-[0.18em] text-blue-400/70">
            Program Admission
          </p>

          <h4 className="mt-2 text-base font-semibold text-white">
            {agreementBound
              ? "Admission Recorded · Agreement Bound"
              : "Admission Recorded · Binding Requires Review"}
          </h4>

          <p className="mt-2 text-sm leading-6 text-gray-300">
            Participant ID:{" "}
            <span className="font-mono text-xs">
              {intake.admittedParticipantId ?? "Missing"}
            </span>
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Program admission does not itself create an appointment or grant
            delegated authority.
          </p>
        </div>
      ) : null}

      {admissionMessage ? (
        <p
          role="status"
          className="mt-4 rounded border border-blue-800/50 bg-blue-950/20 p-3 text-sm text-blue-200"
        >
          {admissionMessage}
        </p>
      ) : null}

      {agreement &&
      signerMatches &&
      !["DRAFT", "EXECUTED"].includes(agreement.status) ? (
        <div className="mt-5 rounded border border-gray-700 bg-black p-4">
          <p className="text-sm text-gray-400">
            Execution controls are unavailable while the agreement is in state{" "}
            <strong className="text-gray-200">{agreement.status}</strong>.
          </p>
        </div>
      ) : null}

      {executionMessage ? (
        <p
          role="status"
          className="mt-4 rounded border border-emerald-800/50 bg-emerald-950/20 p-3 text-sm text-emerald-300"
        >
          {executionMessage}
        </p>
      ) : null}
    </section>
  );
}
