"use client";

import { FormEvent, useState } from "react";

const LOCATION_KINDS = [
  "PROGRAM_ACCOUNT",
  "TREASURY_PARTY",
  "SETTLEMENT_ENDPOINT",
  "EXTERNAL_REFERENCE",
  "OTHER",
] as const;

type LocationKind = (typeof LOCATION_KINDS)[number];

type OriginationSuccess = Readonly<{
  ok: true;

  disposition: "CREATED" | "REPLAYED";

  transfer: Readonly<{
    id: string;

    reference: string;

    status: string;

    version: number;

    programId: string;

    requestedAmount: Readonly<{
      amount: string;

      currency: string;
    }>;

    destinationCurrency: string;

    purpose: string;

    createdAt: string;
  }>;
}>;

type OriginationFailure = Readonly<{
  ok: false;

  error: string;
}>;

type OriginationResponse = OriginationSuccess | OriginationFailure;

type FormState = Readonly<{
  reference: string;

  programId: string;

  instructionId: string;

  sourceKind: LocationKind;

  sourceReference: string;

  destinationKind: LocationKind;

  destinationReference: string;

  amount: string;

  currency: string;

  destinationCurrency: string;

  purpose: string;
}>;

const INITIAL_FORM: FormState = {
  reference: "",

  programId: "",

  instructionId: "",

  sourceKind: "PROGRAM_ACCOUNT",

  sourceReference: "",

  destinationKind: "SETTLEMENT_ENDPOINT",

  destinationReference: "",

  amount: "",

  currency: "USD",

  destinationCurrency: "USD",

  purpose: "",
};

function locationFieldName(kind: LocationKind): string {
  switch (kind) {
    case "PROGRAM_ACCOUNT":
      return "programAccountId";

    case "TREASURY_PARTY":
      return "treasuryPartyId";

    case "SETTLEMENT_ENDPOINT":
      return "settlementEndpointId";

    case "EXTERNAL_REFERENCE":
      return "externalReference";

    case "OTHER":
      return "reference";
  }
}

function locationReferenceLabel(kind: LocationKind): string {
  switch (kind) {
    case "PROGRAM_ACCOUNT":
      return "Program Account ID";

    case "TREASURY_PARTY":
      return "Treasury Party ID";

    case "SETTLEMENT_ENDPOINT":
      return "Settlement Endpoint ID";

    case "EXTERNAL_REFERENCE":
      return "External Reference";

    case "OTHER":
      return "Reference";
  }
}

function buildLocation(
  kind: LocationKind,

  reference: string,
): Record<string, string> {
  return {
    kind,

    [locationFieldName(kind)]: reference.trim(),
  };
}

function formatError(error: string): string {
  const normalized = error
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replaceAll("_", " ");

  return normalized;
}

export default function OriginateTreasuryTransferPanel() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const [result, setResult] = useState<OriginationSuccess | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  function updateField<TKey extends keyof FormState>(
    key: TKey,

    value: FormState[TKey],
  ): void {
    setForm((current) => ({
      ...current,

      [key]: value,
    }));

    /*
     * Any material edit represents a new
     * operator proposition.
     *
     * A retry without edits retains the
     * current Idempotency-Key.
     */
    setIdempotencyKey(null);

    setResult(null);

    setError(null);
  }

  async function originate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const normalizedReference = form.reference.trim();

    const normalizedProgramId = form.programId.trim();

    const normalizedSource = form.sourceReference.trim();

    const normalizedDestination = form.destinationReference.trim();

    const normalizedAmount = form.amount.trim();

    const normalizedCurrency = form.currency.trim().toUpperCase();

    const normalizedDestinationCurrency = form.destinationCurrency
      .trim()
      .toUpperCase();

    const normalizedPurpose = form.purpose.trim();

    if (
      !normalizedReference ||
      !normalizedProgramId ||
      !normalizedSource ||
      !normalizedDestination ||
      !normalizedAmount ||
      !normalizedCurrency ||
      !normalizedDestinationCurrency ||
      !normalizedPurpose
    ) {
      setError("Complete all required Treasury Transfer fields.");

      return;
    }

    const numericAmount = Number(normalizedAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Requested amount must be greater than zero.");

      return;
    }

    const requestKey = idempotencyKey ?? crypto.randomUUID();

    if (!idempotencyKey) {
      setIdempotencyKey(requestKey);
    }

    setLoading(true);

    setError(null);

    try {
      const response = await fetch(
        "/api/admin/control-center/treasury/transfers",
        {
          method: "POST",

          cache: "no-store",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",

            "Idempotency-Key": requestKey,
          },

          body: JSON.stringify({
            reference: normalizedReference,

            programId: normalizedProgramId,

            instructionId: form.instructionId.trim() || undefined,

            source: buildLocation(
              form.sourceKind,

              normalizedSource,
            ),

            destination: buildLocation(
              form.destinationKind,

              normalizedDestination,
            ),

            requestedAmount: {
              amount: normalizedAmount,

              currency: normalizedCurrency,
            },

            destinationCurrency: normalizedDestinationCurrency,

            purpose: normalizedPurpose,
          }),
        },
      );

      const payload = (await response.json()) as OriginationResponse;

      if (!response.ok || !payload.ok) {
        setResult(null);

        setError(
          payload.ok
            ? "Treasury Transfer origination failed."
            : formatError(payload.error),
        );

        return;
      }

      setResult(payload);
    } catch (cause: unknown) {
      console.error("[CONTROL_CENTER_TREASURY_ORIGINATION_FAILED]", cause);

      /*
       * Preserve the Idempotency-Key here.
       * A transport failure may have occurred
       * after Treasury accepted the request.
       *
       * Submitting the unchanged form again
       * will therefore safely replay.
       */
      setError(
        "The Treasury response could not be confirmed. Retry the unchanged request to safely resolve its outcome.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="border-b border-neutral-800 pb-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Treasury Origination
        </div>

        <h2 className="mt-1 text-xl font-medium text-white">
          Originate Treasury Transfer
        </h2>

        <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500">
          Formulate a proposed movement of value for canonical Treasury review.
          Origination creates the Transfer only. It does not approve, plan,
          authorize, or execute it.
        </p>
      </div>

      <form onSubmit={originate} className="mt-4 space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">
              Transfer Reference
            </span>

            <input
              value={form.reference}
              onChange={(event) =>
                updateField(
                  "reference",

                  event.target.value,
                )
              }
              placeholder="AXPT-TR-..."
              className="w-full rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">
              Commercial Program ID
            </span>

            <input
              value={form.programId}
              onChange={(event) =>
                updateField(
                  "programId",

                  event.target.value,
                )
              }
              placeholder="Program identity"
              className="w-full rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-wide text-neutral-600">
            Treasury Instruction ID
            <span className="ml-2 normal-case tracking-normal text-neutral-700">
              optional
            </span>
          </span>

          <input
            value={form.instructionId}
            onChange={(event) =>
              updateField(
                "instructionId",

                event.target.value,
              )
            }
            placeholder="Associated instruction, if applicable"
            className="w-full rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="rounded-lg border border-neutral-800 bg-black/20 p-3">
            <legend className="px-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Source
            </legend>

            <div className="mt-1 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Location Kind
                </span>

                <select
                  value={form.sourceKind}
                  onChange={(event) =>
                    updateField(
                      "sourceKind",

                      event.target.value as LocationKind,
                    )
                  }
                  className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-900"
                >
                  {LOCATION_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                  {locationReferenceLabel(form.sourceKind)}
                </span>

                <input
                  value={form.sourceReference}
                  onChange={(event) =>
                    updateField(
                      "sourceReference",

                      event.target.value,
                    )
                  }
                  className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-900"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-neutral-800 bg-black/20 p-3">
            <legend className="px-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Destination
            </legend>

            <div className="mt-1 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                  Location Kind
                </span>

                <select
                  value={form.destinationKind}
                  onChange={(event) =>
                    updateField(
                      "destinationKind",

                      event.target.value as LocationKind,
                    )
                  }
                  className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-900"
                >
                  {LOCATION_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                  {locationReferenceLabel(form.destinationKind)}
                </span>

                <input
                  value={form.destinationReference}
                  onChange={(event) =>
                    updateField(
                      "destinationReference",

                      event.target.value,
                    )
                  }
                  className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 outline-none focus:border-cyan-900"
                />
              </label>
            </div>
          </fieldset>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">
              Requested Amount
            </span>

            <input
              value={form.amount}
              onChange={(event) =>
                updateField(
                  "amount",

                  event.target.value,
                )
              }
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">
              Source Currency
            </span>

            <input
              value={form.currency}
              onChange={(event) =>
                updateField(
                  "currency",

                  event.target.value,
                )
              }
              placeholder="USD"
              className="w-full rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs uppercase text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">
              Destination Currency
            </span>

            <input
              value={form.destinationCurrency}
              onChange={(event) =>
                updateField(
                  "destinationCurrency",

                  event.target.value,
                )
              }
              placeholder="USD"
              className="w-full rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs uppercase text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-wide text-neutral-600">
            Purpose
          </span>

          <textarea
            value={form.purpose}
            onChange={(event) =>
              updateField(
                "purpose",

                event.target.value,
              )
            }
            rows={3}
            placeholder="State the Treasury purpose of this proposed movement."
            className="w-full resize-y rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs leading-5 text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
          />
        </label>

        {error ? (
          <div className="rounded border border-orange-950 bg-orange-950/10 p-3 text-xs leading-5 text-orange-300">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-cyan-950 bg-cyan-950/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-700">
                  Treasury Response
                </div>

                <div className="mt-1 text-sm font-medium text-cyan-300">
                  {result.disposition}
                </div>
              </div>

              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Version {result.transfer.version}
              </div>
            </div>

            <dl className="mt-4 grid gap-3 text-xs md:grid-cols-2">
              <div>
                <dt className="text-neutral-600">Transfer ID</dt>

                <dd className="mt-1 break-all text-neutral-200">
                  {result.transfer.id}
                </dd>
              </div>

              <div>
                <dt className="text-neutral-600">Status</dt>

                <dd className="mt-1 text-cyan-300">{result.transfer.status}</dd>
              </div>

              <div>
                <dt className="text-neutral-600">Program</dt>

                <dd className="mt-1 break-all text-neutral-200">
                  {result.transfer.programId}
                </dd>
              </div>

              <div>
                <dt className="text-neutral-600">Requested Amount</dt>

                <dd className="mt-1 text-neutral-200">
                  {result.transfer.requestedAmount.amount}{" "}
                  {result.transfer.requestedAmount.currency}
                </dd>
              </div>

              <div className="md:col-span-2">
                <dt className="text-neutral-600">Created</dt>

                <dd className="mt-1 text-neutral-300">
                  {new Date(result.transfer.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[10px] uppercase tracking-wide text-neutral-700">
            Creates canonical Treasury state · does not authorize execution
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded border border-cyan-950 bg-cyan-950/20 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-cyan-300 hover:border-cyan-800 hover:bg-cyan-950/30 disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? "Originating" : "Originate Transfer"}
          </button>
        </div>
      </form>
    </section>
  );
}
