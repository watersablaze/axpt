"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE,
  type DigitalSettlementTreasuryAdmissionState,
} from "@/domains/control-center/treasury/digitalSettlementReceiptAdmissionState";

type Money =
  Readonly<{
    amount:
      string;

    currency:
      string;
  }>;

type Candidate =
  Readonly<{
    recognitionEventId:
      string;

    instrumentId:
      string;

    instrumentVersionId:
      string;

    settlementInstructionId:
      string;

    observationId:
      string;

    chainId:
      number;

    transactionHash:
      string;

    logIndex:
      number;

    tokenContractAddress:
      string;

    receivingAddress:
      string;

    amount:
      Money;

    receivedAt:
      string;

    recognizedAt:
      string;
  }>;

type CandidateResponse =
  | Readonly<{
      ok:
        true;

      state:
        DigitalSettlementTreasuryAdmissionState;

      candidate:
        Candidate;

      treasuryReceipt:
        ReportedReceipt | null;
    }>
  | Readonly<{
      ok:
        false;

      state:
        DigitalSettlementTreasuryAdmissionState;

      error:
        string;
    }>;

type ReportedReceipt =
  Readonly<{
    id:
      string;

    reference:
      string;

    status:
      string;

    version:
      number;

    programId:
      string;

    destinationProgramAccountId:
      string;

    declaredAmount:
      Money;

    externalReference:
      string | null;

    receivedAt:
      string;

    createdAt:
      string;
  }>;

type ReportResponse =
  | Readonly<{
      ok:
        true;

      state:
        DigitalSettlementTreasuryAdmissionState;

      disposition:
        "REPORTED" | "REPLAYED";

      receipt:
        ReportedReceipt;
    }>
  | Readonly<{
      ok:
        false;

      state:
        DigitalSettlementTreasuryAdmissionState;

      error:
        string;
    }>;

type RoutingForm =
  Readonly<{
    programId:
      string;

    destinationProgramAccountId:
      string;

    authorityGrantId:
      string;
  }>;

const INITIAL_ROUTING:
  RoutingForm = {
  programId:
    "",

  destinationProgramAccountId:
    "",

  authorityGrantId:
    "",
};

function describeAdmissionState(
  state:
    DigitalSettlementTreasuryAdmissionState,
): string {
  switch (
    state
  ) {
    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.INVALID_REQUEST:
      return "The admission request is incomplete or invalid.";

    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.NOT_FOUND:
      return "No recognized DSI Treasury receipt candidate was found for this reference.";

    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.RECOGNITION_NOT_READY:
      return "The DSI exists, but its recognized settlement fact is not yet ready for Treasury admission.";

    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.REPORTABLE:
      return "The recognized DSI receipt fact is ready for explicit Treasury routing.";

    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.ALREADY_REPORTED:
      return "The recognized DSI receipt fact is already admitted as a Treasury Program Capital Receipt.";

    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.ROUTING_COLLISION:
      return "The recognized receipt fact is already bound to a different Treasury routing proposition. Do not create a second receipt.";

    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.INTEGRITY_FAILURE:
      return "Treasury admission is blocked because durable institutional state failed an integrity check.";

    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.UNAUTHENTICATED:
      return "An authenticated AXPT session is required to access this Treasury admission surface.";

    case DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.PERMISSION_DENIED:
      return "The current operator does not hold the Treasury authority required for this action.";
  }
}

function formatMoney(
  money:
    Money,
): string {
  const numeric =
    Number(
      money.amount,
    );

  if (
    !Number.isFinite(
      numeric,
    )
  ) {
    return `${money.amount} ${money.currency}`;
  }

  return `${new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits:
        6,
    },
  ).format(numeric)} ${money.currency}`;
}

function formatDate(
  value:
    string,
): string {
  const parsed =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return parsed.toLocaleString();
}

export default function DigitalSettlementReceiptAdmissionPanel() {
  const [
    reference,
    setReference,
  ] =
    useState("");

  const [
    candidate,
    setCandidate,
  ] =
    useState<Candidate | null>(
      null,
    );

  const [
    treasuryReceipt,
    setTreasuryReceipt,
  ] =
    useState<ReportedReceipt | null>(
      null,
    );

  const [
    routing,
    setRouting,
  ] =
    useState<RoutingForm>(
      INITIAL_ROUTING,
    );

  const [
    result,
    setResult,
  ] =
    useState<
      Extract<
        ReportResponse,
        {
          ok:
            true;
        }
      > | null
    >(
      null,
    );

  const [
    admissionState,
    setAdmissionState,
  ] =
    useState<DigitalSettlementTreasuryAdmissionState | null>(
      null,
    );

  const [
    loadError,
    setLoadError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    reportError,
    setReportError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    loadingCandidate,
    setLoadingCandidate,
  ] =
    useState(
      false,
    );

  const [
    reporting,
    setReporting,
  ] =
    useState(
      false,
    );

  function updateReference(
    value:
      string,
  ): void {
    setReference(
      value,
    );

    /*
     * A different instrument reference invalidates
     * the presently perceived source fact.
     */
    setCandidate(
      null,
    );

    setTreasuryReceipt(
      null,
    );

    setResult(
      null,
    );

    setAdmissionState(
      null,
    );

    setLoadError(
      null,
    );

    setReportError(
      null,
    );
  }

  function updateRouting<
    TKey extends keyof RoutingForm,
  >(
    key:
      TKey,

    value:
      RoutingForm[TKey],
  ): void {
    setRouting(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    );

    /*
     * Material routing edits represent a new
     * Treasury proposition.
     *
     * Existing receipt history is not altered.
     */
    setResult(
      null,
    );

    setReportError(
      null,
    );
  }

  async function loadCandidate():
    Promise<void> {
    const normalizedReference =
      reference.trim();

    if (
      !normalizedReference
    ) {
      setLoadError(
        "Enter a Digital Settlement Instrument reference.",
      );

      return;
    }

    setLoadingCandidate(
      true,
    );

    setAdmissionState(
      null,
    );

    setLoadError(
      null,
    );

    setReportError(
      null,
    );

    setResult(
      null,
    );

    try {
      const response =
        await fetch(
          `/api/admin/control-center/treasury/dsi-receipts/${encodeURIComponent(
            normalizedReference,
          )}`,
          {
            method:
              "GET",

            cache:
              "no-store",

            credentials:
              "include",
          },
        );

      const payload =
        (await response.json()) as
          CandidateResponse;

      if (
        !response.ok ||
        !payload.ok
      ) {
        setCandidate(
          null,
        );

        setTreasuryReceipt(
          null,
        );

        if (
          payload.ok
        ) {
          setAdmissionState(
            null,
          );

          setLoadError(
            "Treasury receipt candidate could not be loaded.",
          );
        } else {
          setAdmissionState(
            payload.state,
          );

          setLoadError(
            null,
          );
        }

        return;
      }

      setAdmissionState(
        payload.state,
      );

      setCandidate(
        payload.candidate,
      );

      setTreasuryReceipt(
        payload.treasuryReceipt,
      );
    } catch (
      cause:
        unknown
    ) {
      console.error(
        "[CONTROL_CENTER_DSI_RECEIPT_CANDIDATE_LOAD_FAILED]",
        cause,
      );

      setAdmissionState(
        null,
      );

      setCandidate(
        null,
      );

      setTreasuryReceipt(
        null,
      );

      setLoadError(
        "The recognized DSI source fact could not be perceived from Treasury.",
      );
    } finally {
      setLoadingCandidate(
        false,
      );
    }
  }

  async function reportReceipt(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedReference =
      reference.trim();

    const normalizedProgramId =
      routing.programId.trim();

    const normalizedDestinationProgramAccountId =
      routing.destinationProgramAccountId.trim();

    const normalizedAuthorityGrantId =
      routing.authorityGrantId.trim();

    if (
      !candidate
    ) {
      setReportError(
        "Load the recognized DSI receipt candidate before assigning Treasury routing.",
      );

      return;
    }

    if (
      !normalizedReference ||
      !normalizedProgramId ||
      !normalizedDestinationProgramAccountId
    ) {
      setReportError(
        "Program ID and Destination Program Account ID are required.",
      );

      return;
    }

    setReporting(
      true,
    );

    setReportError(
      null,
    );

    try {
      const response =
        await fetch(
          `/api/admin/control-center/treasury/dsi-receipts/${encodeURIComponent(
            normalizedReference,
          )}/report`,
          {
            method:
              "POST",

            cache:
              "no-store",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                programId:
                  normalizedProgramId,

                destinationProgramAccountId:
                  normalizedDestinationProgramAccountId,

                authorityGrantId:
                  normalizedAuthorityGrantId ||
                  undefined,
              }),
          },
        );

      const payload =
        (await response.json()) as
          ReportResponse;

      if (
        !response.ok ||
        !payload.ok
      ) {
        setResult(
          null,
        );

        if (
          payload.ok
        ) {
          setAdmissionState(
            null,
          );

          setReportError(
            "Treasury receipt reporting failed.",
          );
        } else {
          setAdmissionState(
            payload.state,
          );

          setReportError(
            null,
          );
        }

        return;
      }

      setAdmissionState(
        payload.state,
      );

      setResult(
        payload,
      );

      setTreasuryReceipt(
        payload.receipt,
      );
    } catch (
      cause:
        unknown
    ) {
      console.error(
        "[CONTROL_CENTER_DSI_RECEIPT_REPORT_FAILED]",
        cause,
      );

      /*
       * The receipt identity is deterministic from
       * the canonical observation.
       *
       * Retrying unchanged routing is therefore safe:
       * Treasury will resolve to REPORTED or REPLAYED.
       */
      setAdmissionState(
        null,
      );

      setReportError(
        "The Treasury response could not be confirmed. Retry the unchanged routing to safely resolve the receipt outcome.",
      );
    } finally {
      setReporting(
        false,
      );
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="border-b border-neutral-800 pb-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Treasury Admission
        </div>

        <h2 className="mt-1 text-xl font-medium text-white">
          DSI Receipt Admission
        </h2>

        <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500">
          Inspect a recognized Digital Settlement receipt fact, then explicitly
          route that fact into Treasury as a Program Capital Receipt. Reporting
          establishes receipt state only. It does not verify or recognize
          capital.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">
              DSI Reference
            </span>

            <input
              value={reference}
              onChange={(
                event,
              ) =>
                updateReference(
                  event.target.value,
                )
              }
              placeholder="FW-DSI-..."
              className="w-full rounded border border-neutral-800 bg-black/30 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
            />
          </label>

          <button
            type="button"
            disabled={
              loadingCandidate
            }
            onClick={
              loadCandidate
            }
            className="rounded border border-neutral-700 bg-black/30 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-neutral-200 hover:border-cyan-800 hover:text-cyan-300 disabled:cursor-wait disabled:opacity-50"
          >
            {loadingCandidate
              ? "Loading Candidate"
              : "Load Candidate"}
          </button>
        </div>

        {admissionState ? (
          <div className="rounded border border-neutral-800 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
              Admission State
            </div>

            <div className="mt-1 text-xs font-medium text-neutral-200">
              {admissionState}
            </div>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              {describeAdmissionState(
                admissionState,
              )}
            </p>
          </div>
        ) : null}

        {loadError ? (
          <div className="rounded border border-orange-950 bg-orange-950/10 p-3 text-xs leading-5 text-orange-300">
            {loadError}
          </div>
        ) : null}

        {candidate ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-800 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-600">
                    Recognized Source
                  </div>

                  <div className="mt-1 text-sm font-medium text-white">
                    {formatMoney(
                      candidate.amount,
                    )}
                  </div>
                </div>

                <div className="text-[10px] uppercase tracking-wide text-cyan-700">
                  {admissionState ===
                  DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.ALREADY_REPORTED
                    ? "Treasury Receipt Present"
                    : admissionState ===
                        DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.REPORTABLE
                      ? "Reportable"
                      : admissionState ?? "State Unresolved"}
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-xs md:grid-cols-2">
                <div>
                  <dt className="text-neutral-600">
                    Instrument
                  </dt>

                  <dd className="mt-1 break-all text-neutral-200">
                    {candidate.instrumentId}
                  </dd>
                </div>

                <div>
                  <dt className="text-neutral-600">
                    Instrument Version
                  </dt>

                  <dd className="mt-1 break-all text-neutral-300">
                    {candidate.instrumentVersionId}
                  </dd>
                </div>

                <div>
                  <dt className="text-neutral-600">
                    Observation
                  </dt>

                  <dd className="mt-1 break-all text-neutral-200">
                    {candidate.observationId}
                  </dd>
                </div>

                <div>
                  <dt className="text-neutral-600">
                    Chain Event
                  </dt>

                  <dd className="mt-1 text-neutral-300">
                    Chain {candidate.chainId} · Log {candidate.logIndex}
                  </dd>
                </div>

                <div className="md:col-span-2">
                  <dt className="text-neutral-600">
                    Transaction
                  </dt>

                  <dd className="mt-1 break-all font-mono text-[11px] text-neutral-300">
                    {candidate.transactionHash}
                  </dd>
                </div>

                <div>
                  <dt className="text-neutral-600">
                    Received on Chain
                  </dt>

                  <dd className="mt-1 text-neutral-300">
                    {formatDate(
                      candidate.receivedAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-neutral-600">
                    Institutionally Recognized
                  </dt>

                  <dd className="mt-1 text-neutral-300">
                    {formatDate(
                      candidate.recognizedAt,
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-neutral-800 pt-3 text-[10px] uppercase tracking-wide text-neutral-600">
                <span>
                  Read Only Source Fact
                </span>

                <span>
                  No Treasury routing inferred
                </span>
              </div>
            </div>

            {treasuryReceipt ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-cyan-950 bg-cyan-950/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-700">
                        Existing Treasury Receipt
                      </div>

                      <div className="mt-1 text-sm font-medium text-cyan-300">
                        {treasuryReceipt.status}
                      </div>
                    </div>

                    <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                      Version {treasuryReceipt.version}
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 text-xs md:grid-cols-2">
                    <div>
                      <dt className="text-neutral-600">
                        Receipt ID
                      </dt>

                      <dd className="mt-1 break-all text-neutral-200">
                        {treasuryReceipt.id}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-neutral-600">
                        Receipt Reference
                      </dt>

                      <dd className="mt-1 break-all text-neutral-300">
                        {treasuryReceipt.reference}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-neutral-600">
                        Program
                      </dt>

                      <dd className="mt-1 break-all text-neutral-200">
                        {treasuryReceipt.programId}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-neutral-600">
                        Destination Program Account
                      </dt>

                      <dd className="mt-1 break-all text-neutral-200">
                        {treasuryReceipt.destinationProgramAccountId}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-neutral-600">
                        Declared Amount
                      </dt>

                      <dd className="mt-1 text-neutral-200">
                        {formatMoney(
                          treasuryReceipt.declaredAmount,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-neutral-600">
                        Received
                      </dt>

                      <dd className="mt-1 text-neutral-300">
                        {treasuryReceipt.receivedAt
                          ? formatDate(
                              treasuryReceipt.receivedAt,
                            )
                          : "Not recorded"}
                      </dd>
                    </div>

                    <div className="md:col-span-2">
                      <dt className="text-neutral-600">
                        External Reference
                      </dt>

                      <dd className="mt-1 break-all font-mono text-[11px] text-neutral-300">
                        {treasuryReceipt.externalReference ??
                          "Not recorded"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-2xl text-[10px] uppercase leading-5 tracking-wide text-neutral-700">
                    RECEIPT ALREADY ADMITTED · REPORTED ≠ VERIFIED · REPORTED ≠
                    RECOGNIZED CAPITAL · REPORTED ≠ AVAILABLE CAPITAL · REPORTED
                    ≠ EXECUTABLE CAPACITY
                  </div>

                  <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-700">
                    Read Only Treasury State
                  </div>
                </div>
              </div>
            ) : admissionState ===
              DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.REPORTABLE ? (
              <form
                onSubmit={
                  reportReceipt
                }
                className="space-y-4"
              >
                <fieldset className="rounded-lg border border-neutral-800 bg-black/20 p-4">
                  <legend className="px-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    Treasury Routing
                  </legend>

                  <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-600">
                    Routing identifiers are supplied explicitly by the Treasury
                    operator. They are not inferred from the DSI, wallet address,
                    blockchain observation, or recognizing operator.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                        Commercial Program ID
                      </span>

                      <input
                        value={
                          routing.programId
                        }
                        onChange={(
                          event,
                        ) =>
                          updateRouting(
                            "programId",

                            event.target.value,
                          )
                        }
                        placeholder="Program identity"
                        className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
                      />
                    </label>

                    <label className="space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                        Destination Program Account ID
                      </span>

                      <input
                        value={
                          routing.destinationProgramAccountId
                        }
                        onChange={(
                          event,
                        ) =>
                          updateRouting(
                            "destinationProgramAccountId",

                            event.target.value,
                          )
                        }
                        placeholder="Program account identity"
                        className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
                      />
                    </label>
                  </div>

                  <label className="mt-3 block space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                      Authority Grant ID
                      <span className="ml-2 normal-case tracking-normal text-neutral-700">
                        optional
                      </span>
                    </span>

                    <input
                      value={
                        routing.authorityGrantId
                      }
                      onChange={(
                        event,
                      ) =>
                        updateRouting(
                          "authorityGrantId",

                          event.target.value,
                        )
                      }
                      placeholder="Treasury authority evidence, if applicable"
                      className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-cyan-900"
                    />
                  </label>
                </fieldset>

                {reportError ? (
                  <div className="rounded border border-orange-950 bg-orange-950/10 p-3 text-xs leading-5 text-orange-300">
                    {reportError}
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
                        Version {result.receipt.version}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-neutral-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-2xl text-[10px] uppercase leading-5 tracking-wide text-neutral-700">
                    REPORTED ≠ VERIFIED · REPORTED ≠ RECOGNIZED CAPITAL ·
                    REPORTED ≠ AVAILABLE CAPITAL · REPORTED ≠ EXECUTABLE CAPACITY
                  </div>

                  <button
                    type="submit"
                    disabled={
                      reporting
                    }
                    className="shrink-0 rounded border border-cyan-950 bg-cyan-950/20 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-cyan-300 hover:border-cyan-800 hover:bg-cyan-950/30 disabled:cursor-wait disabled:opacity-50"
                  >
                    {reporting
                      ? "Reporting Receipt"
                      : "Report Receipt to Treasury"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-lg border border-neutral-800 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">
                  Treasury Admission Not Actionable
                </div>

                <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-500">
                  {admissionState
                    ? describeAdmissionState(
                        admissionState,
                      )
                    : "Treasury admission state is unresolved. Reload the DSI reference before attempting any routing action."}
                </p>

                <div className="mt-3 text-[10px] uppercase leading-5 tracking-wide text-neutral-700">
                  NO RECEIPT ACTION AVAILABLE · STATE MUST BE REPORTABLE
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-900 bg-black/10 p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-700">
              No Candidate Loaded
            </div>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-600">
              Load a recognized DSI reference to inspect its durable receipt
              candidate before any Treasury routing or receipt reporting is
              permitted.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
