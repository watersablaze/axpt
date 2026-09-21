"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type VerificationEvidence = Readonly<{
  disposition:
    | "NO_MATCH"
    | "MATCHED"
    | "AMBIGUOUS_OBSERVATIONS"
    | "AMBIGUOUS_INSTRUCTIONS";

  amountUsdt: string;
  receivingAddress: string;
  network: "Ethereum Mainnet";

  candidate:
    | Readonly<{
        transactionHash: string;
        blockNumber: string;
        chainTimestamp: string;
        senderAddress: string;
        confirmationCount: number;
        requiredConfirmations: number;
      }>
    | null;

  candidateCount: number | null;

  conflictingInstrumentReferences:
    readonly string[];
}>;

type ObserverRunResult = Readonly<{
  disposition: "BOOTSTRAP_REQUIRED" | "IDLE" | "ADVANCED";
  chainId: number;
  network: string;
  watchedAddress: string;
  tokenContractAddress: string;
  headBlock: string;
  cursorBefore: string | null;
  scannedFrom: string | null;
  scannedTo: string | null;
  cursorAfter: string | null;
  observed: number;
  persisted: number;
  validationCandidates: number;
  validated: number;
  chainUnavailable: number;
}>;

type Props = {
  instantiated: boolean;
  currentVersion: number;
  reference: string;
  counterpartyName: string;
  counterpartyRepresentative: string | null;
  settlementStatus: string;
  pricingStatus: string;
  verificationAmountUsdt: string;
  verificationTxHash: string | null;
  verificationConfirmedAt: string | null;
  principalAuthorizedAt: string | null;
  receivingAddress: string | null;
  settlementAmountUsd: string | null;
  authorizedOperationsAddress: string;
  authorizedOperationsName: string;
  defaultSpotBenchmark: string;
  defaultSpotPricePerKgUsd: string;
  verificationEvidence: VerificationEvidence | null;
};

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default function DigitalSettlementOperatorPanel({
  instantiated,
  currentVersion,
  reference,
  counterpartyName,
  counterpartyRepresentative,
  settlementStatus,
  pricingStatus,
  verificationAmountUsdt,
  verificationTxHash,
  verificationConfirmedAt,
  principalAuthorizedAt,
  receivingAddress,
  settlementAmountUsd,
  authorizedOperationsAddress,
  authorizedOperationsName,
  defaultSpotBenchmark,
  defaultSpotPricePerKgUsd,
  verificationEvidence,
}: Props) {
  const router = useRouter();

  const [busy, setBusy] = useState<
    | "issuance"
    | "v2"
    | "access"
    | "observer"
    | "verification"
    | "principal"
    | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observerResult, setObserverResult] =
    useState<ObserverRunResult | null>(null);
  const [replacementAccessUrl, setReplacementAccessUrl] = useState("");
  const [spotBenchmark, setSpotBenchmark] = useState(defaultSpotBenchmark);
  const [spotPricePerKgUsd, setSpotPricePerKgUsd] = useState(
    defaultSpotPricePerKgUsd,
  );

  const spotPrice = Number(spotPricePerKgUsd);
  const purchasePricePerKg = Number.isFinite(spotPrice)
    ? Math.round(spotPrice * 0.9 * 100) / 100
    : null;
  const transactionValue = purchasePricePerKg !== null
    ? Math.round(purchasePricePerKg * 50 * 100) / 100
    : null;
  const tapAmount = transactionValue !== null
    ? Math.round(transactionValue * 0.075 * 100) / 100
    : null;

  const canIssueV2 =
    instantiated &&
    currentVersion === 1 &&
    settlementStatus === "AWAITING_VERIFICATION_TRANSFER" &&
    pricingStatus === "FIXED" &&
    verificationTxHash === null &&
    verificationConfirmedAt === null &&
    principalAuthorizedAt === null;

  const canConfirmVerification =
    settlementStatus === "AWAITING_VERIFICATION_TRANSFER" &&
    verificationEvidence?.disposition === "MATCHED" &&
    verificationEvidence.candidate !== null;

  const canAuthorizePrincipal =
    settlementStatus === "VERIFICATION_CONFIRMED" &&
    pricingStatus === "FIXED";

  const principalAlreadyAuthorized =
    settlementStatus === "AWAITING_TRANSFER" &&
    principalAuthorizedAt !== null;

  const remainingAmount =
    settlementAmountUsd !== null
      ? Math.max(
          Number(settlementAmountUsd) -
            Number(verificationAmountUsdt),
          0,
        ).toFixed(2)
      : null;

  async function issueInstrument() {
    if (instantiated || busy) {
      return;
    }

    if (!spotBenchmark.trim() || !Number.isFinite(spotPrice) || spotPrice <= 0) {
      setError(
        "An approved benchmark and positive spot price per KG are required.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Fix the Good-Faith TAP at ${tapAmount?.toFixed(2)} USDT and issue ${reference} to Corey Keller using ${authorizedOperationsName} (${authorizedOperationsAddress}) as the receiving wallet?`,
    );

    if (!confirmed) {
      return;
    }

    setBusy("issuance");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/instruments/digital-settlement/${encodeURIComponent(
          reference,
        )}/issue`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receivingAddress:
              authorizedOperationsAddress,
            accessExpiresHours: 168,
            spotBenchmark,
            spotPricePerKgUsd,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "DSI_INITIAL_ISSUANCE_FAILED",
        );
      }

      const accessUrl =
        payload.result?.accessUrl ?? null;

      const emailOk =
        payload.result?.email?.ok !== false;

      setMessage(
        emailOk
          ? `DSI issued. Private access created and issuance communication processed. ${accessUrl ?? ""}`.trim()
          : `DSI issued and private access created, but email delivery failed. Preserve this private URL: ${accessUrl ?? "URL unavailable"}`,
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DSI_INITIAL_ISSUANCE_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }


  async function issueV2FinancierRevision() {
    if (!canIssueV2 || busy) {
      return;
    }

    const confirmed = window.confirm(
      [
        `Issue Version 2 of ${reference}?`,
        "",
        "This institutional revision will:",
        "• supersede V1 with V2",
        "• preserve the fixed commercial snapshot",
        "• preserve the current settlement state",
        "• create five V2-bound VIEW grants",
        "• send five separate private communications after commit",
        "",
        `Verification authority remains exactly ${verificationAmountUsdt} USDT.`,
        `Remaining TAP remains ${remainingAmount ?? "unresolved"} USDT — NOT AUTHORIZED.`,
        "",
        "This action does NOT recognize verification and does NOT authorize the remaining TAP.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    setBusy("v2");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/instruments/digital-settlement/${encodeURIComponent(
          reference,
        )}/issue-v2`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessExpiresHours: 168,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "DSI_V2_ISSUANCE_FAILED",
        );
      }

      const delivery =
        payload.result?.delivery ?? null;

      if (delivery?.ok) {
        setMessage(
          `V2 committed. Five version-bound private access grants were created and all ${delivery.succeeded ?? 5} communications were delivered.`,
        );
      } else {
        const succeeded =
          delivery?.succeeded ?? 0;
        const failed =
          delivery?.failed ?? 5;

        setMessage(
          `V2 committed, but delivery is incomplete: ${succeeded} succeeded, ${failed} failed. Do not issue V2 again; use the governed delivery-recovery path.`,
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DSI_V2_ISSUANCE_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }


  async function sendAccessReissued() {
    if (!instantiated || busy) {
      return;
    }

    const accessUrl = replacementAccessUrl.trim();

    if (!accessUrl) {
      setError("The replacement private access URL is required.");
      return;
    }

    const confirmed = window.confirm(
      `Send Corey Keller the updated private access communication for ${reference}?`,
    );

    if (!confirmed) {
      return;
    }

    setBusy("access");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/instruments/digital-settlement/${encodeURIComponent(
          reference,
        )}/access-reissued`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessUrl,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "DSI_ACCESS_REISSUED_FAILED",
        );
      }

      setReplacementAccessUrl("");
      setMessage(
        "Updated private access communication sent to Corey Keller and internal recipients.",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DSI_ACCESS_REISSUED_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }


  async function confirmVerification() {
    if (!canConfirmVerification || busy) {
      return;
    }

    const candidate =
      verificationEvidence?.candidate;

    if (!candidate) {
      return;
    }

    const confirmed = window.confirm(
      `Recognize the ${verificationAmountUsdt} USDT verification transfer ${candidate.transactionHash} for ${reference}?`,
    );

    if (!confirmed) {
      return;
    }

    setBusy("verification");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/instruments/digital-settlement/${encodeURIComponent(
          reference,
        )}/confirm-verification`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionHash:
              candidate.transactionHash,

            observedAmountUsdt:
              verificationEvidence.amountUsdt,

            observedReceivingAddress:
              verificationEvidence.receivingAddress,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "DSI_CONFIRM_VERIFICATION_FAILED",
        );
      }

      setMessage(
        "Verification confirmed. Buyer and internal notifications processed according to DSI email mode.",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DSI_CONFIRM_VERIFICATION_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }

  async function runObserverCatchUp() {
    if (
      settlementStatus !== "AWAITING_VERIFICATION_TRANSFER" ||
      busy
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Run one bounded Ethereum observer catch-up for ${reference}? This may record chain observations and advance the observer cursor, but it cannot recognize verification or authorize TAP.`,
    );

    if (!confirmed) {
      return;
    }

    setBusy("observer");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/treasury/settlement-observer/run",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            command: "RUN_BOUNDED_CATCH_UP",
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "SETTLEMENT_OBSERVER_CATCH_UP_FAILED",
        );
      }

      const result = payload.result as ObserverRunResult;

      setObserverResult(result);
      setMessage(
        result.disposition === "ADVANCED"
          ? `Observer advanced through block ${result.cursorAfter ?? result.scannedTo ?? "unknown"}. Recognition remains operator-controlled.`
          : result.disposition === "IDLE"
            ? "Observer is at the current chain head. Recognition remains operator-controlled."
            : "Observer cursor requires a separately governed bootstrap boundary.",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "SETTLEMENT_OBSERVER_CATCH_UP_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }

  async function authorizePrincipal() {
    if (!canAuthorizePrincipal || busy) {
      return;
    }

    const confirmed = window.confirm(
      remainingAmount
        ? `Authorize the remaining ${remainingAmount} USDT Good-Faith TAP for ${reference}?`
        : `Authorize the remaining Good-Faith TAP for ${reference}?`,
    );

    if (!confirmed) {
      return;
    }

    setBusy("principal");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/instruments/digital-settlement/${encodeURIComponent(
          reference,
        )}/authorize-principal`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "DSI_AUTHORIZE_PRINCIPAL_FAILED",
        );
      }

      setMessage(
        "Remaining TAP authorized. Buyer and internal notifications processed according to DSI email mode.",
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DSI_AUTHORIZE_PRINCIPAL_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-neutral-800 bg-black/30 p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Digital Settlement Instrument
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-white">
              {reference}
            </h1>

            <p className="mt-1 text-sm text-neutral-400">
              {counterpartyName}
              {counterpartyRepresentative
                ? ` · ${counterpartyRepresentative}`
                : ""}
            </p>
          </div>

          <div className="rounded border border-cyan-900/70 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-300">
            {formatStatus(settlementStatus)}
          </div>
        </div>
      </section>

      {!instantiated ? (
        <section className="rounded-xl border border-amber-900/70 bg-amber-950/10 p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-amber-400">
            Initial Issuance
          </div>

          <h2 className="mt-1 text-sm font-medium text-white">
            Issue Digital Settlement Instruction to Corey Keller
          </h2>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            This action will instantiate the canonical DSI, bind the registered
            AXPT Operations wallet, authorize only the 50 USDT verification
            transfer, create Corey Keller&apos;s private access grant, and
            process the issuance communication.
          </p>

          <div className="mt-4 rounded border border-neutral-800 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Authorized Receiving Wallet
            </div>

            <div className="mt-1 text-xs text-white">
              {authorizedOperationsName}
            </div>

            <div className="mt-1 break-all font-mono text-[11px] text-cyan-300">
              {authorizedOperationsAddress}
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded border border-neutral-800 bg-black/30 p-3 md:grid-cols-2">
            <label className="text-[10px] uppercase tracking-wide text-neutral-500 md:col-span-2">
              Approved benchmark
              <input
                value={spotBenchmark}
                onChange={(event) => setSpotBenchmark(event.target.value)}
                className="mt-2 w-full rounded border border-neutral-700 bg-black px-3 py-2 text-xs normal-case tracking-normal text-white"
              />
            </label>
            <label className="text-[10px] uppercase tracking-wide text-neutral-500">
              Spot price per KG (USD)
              <input
                inputMode="decimal"
                value={spotPricePerKgUsd}
                onChange={(event) => setSpotPricePerKgUsd(event.target.value)}
                className="mt-2 w-full rounded border border-neutral-700 bg-black px-3 py-2 text-xs normal-case tracking-normal text-white"
              />
            </label>
            <div className="rounded border border-neutral-800 p-3 text-xs text-neutral-400">
              <div>
                Purchase price / KG: {" "}
                <span className="text-white">
                  {purchasePricePerKg?.toFixed(2) ?? "—"}
                </span>
              </div>
              <div className="mt-1">
                50 KG value: {" "}
                <span className="text-white">
                  {transactionValue?.toFixed(2) ?? "—"}
                </span>
              </div>
              <div className="mt-1">
                7.5% TAP: {" "}
                <span className="text-amber-300">
                  {tapAmount?.toFixed(2) ?? "—"} USDT
                </span>
              </div>
            </div>
            <p className="text-[11px] leading-5 text-neutral-500 md:col-span-2">
              Issuance fixes this approved benchmark and calculated TAP as the
              immutable commercial snapshot shown to the buyer.
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={issueInstrument}
              disabled={Boolean(busy)}
              className="rounded border border-amber-800 bg-amber-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "issuance"
                ? "Issuing..."
                : "Issue to Corey Keller"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-800 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Pricing
          </div>
          <div className="mt-1 text-sm text-white">
            {formatStatus(pricingStatus)}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Verification
          </div>
          <div className="mt-1 text-sm text-white">
            {verificationConfirmedAt
              ? "CONFIRMED"
              : `${verificationAmountUsdt} USDT REQUIRED`}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            TAP Authority
          </div>
          <div className="mt-1 text-sm text-white">
            {principalAlreadyAuthorized
              ? "AUTHORIZED"
              : canAuthorizePrincipal
                ? "READY FOR AUTHORIZATION"
                : "NOT AUTHORIZED"}
          </div>
        </div>
      </section>

      {instantiated ? (
        <section className="rounded-xl border border-neutral-800 bg-black/20 p-5 sm:p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Private Instrument Access
          </div>

          <h2 className="mt-1 text-sm font-medium text-white">
            Send Updated Access
          </h2>

          <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
            Send Corey Keller a branded French-Ward / AXPT access-update
            communication. AXPT will verify that the supplied private URL
            belongs to his current active VIEW grant before sending. This
            action does not alter settlement state, pricing, verification, or
            TAP authority.
          </p>

          <label className="mt-4 block text-[10px] uppercase tracking-wide text-neutral-500">
            Replacement private instrument URL
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={replacementAccessUrl}
              onChange={(event) =>
                setReplacementAccessUrl(event.target.value)
              }
              placeholder="Paste current private access URL"
              className="mt-2 w-full rounded border border-neutral-700 bg-black px-3 py-2 font-mono text-xs normal-case tracking-normal text-white"
            />
          </label>

          <p className="mt-2 text-[11px] leading-5 text-neutral-600">
            The credential is submitted only for validation and communication
            delivery. Do not copy it into logs, screenshots, or operator notes.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={sendAccessReissued}
              disabled={
                !replacementAccessUrl.trim() ||
                Boolean(busy)
              }
              className="rounded border border-amber-800 bg-amber-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "access"
                ? "Sending..."
                : "Send Updated Access"}
            </button>
          </div>
        </section>
      ) : null}


      <section className="rounded-xl border border-neutral-800 bg-black/20 p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Supervised Chain Observer
        </div>

        <h2 className="mt-1 text-sm font-medium text-white">
          Observe Ethereum Settlement Rail
        </h2>

        <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
          Run one bounded catch-up from the durable Production cursor. This
          action may record canonical USDT transfer evidence and advance the
          cursor. It cannot recognize verification, authorize the remaining
          TAP, send recognition communications, or change the DSI lifecycle.
        </p>

        <div className="mt-4">
          <button
            type="button"
            onClick={runObserverCatchUp}
            disabled={
              settlementStatus !== "AWAITING_VERIFICATION_TRANSFER" ||
              Boolean(busy)
            }
            className="rounded border border-cyan-900 bg-cyan-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "observer"
              ? "Observing..."
              : "Run Bounded Observer Catch-Up"}
          </button>
        </div>

        {observerResult ? (
          <div className="mt-4 rounded border border-neutral-800 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-wide text-cyan-400">
              Observer Result · {formatStatus(observerResult.disposition)}
            </div>

            <div className="mt-3 grid gap-3 text-xs md:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Scanned Range
                </div>
                <div className="mt-1 font-mono text-white">
                  {observerResult.scannedFrom ?? "—"}
                  {" → "}
                  {observerResult.scannedTo ?? "—"}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Cursor / Head
                </div>
                <div className="mt-1 font-mono text-white">
                  {observerResult.cursorAfter ??
                    observerResult.cursorBefore ??
                    "—"}
                  {" / "}
                  {observerResult.headBlock}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Observed / Persisted
                </div>
                <div className="mt-1 text-white">
                  {observerResult.observed} / {observerResult.persisted}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                  Validated / Unavailable
                </div>
                <div className="mt-1 text-white">
                  {observerResult.validated} / {observerResult.chainUnavailable}
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-neutral-600">
              Machine observation is evidence only. Refreshing chain evidence
              does not perform operator recognition or authorize the remaining
              {remainingAmount ? ` ${remainingAmount} USDT` : ""} TAP.
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-amber-900/60 bg-amber-950/10 p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-amber-500">
          Institutional Revision
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium text-white">
            V2 — TAP Financier Revision
          </h2>

          <span className="rounded border border-neutral-700 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
            CURRENT V{currentVersion}
          </span>
        </div>

        <p className="mt-2 max-w-3xl text-xs leading-5 text-neutral-400">
          Version 2 changes participant authority and private access routing
          without changing the fixed commercial snapshot or the existing
          settlement state.
        </p>

        <div className="mt-4 grid gap-2 text-xs md:grid-cols-2">
          <div className="rounded border border-neutral-800 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Active Authority
            </div>
            <div className="mt-1 text-white">
              TAP Financier
            </div>
            <div className="mt-1 text-amber-300">
              {verificationAmountUsdt} USDT — verification transfer only
            </div>
          </div>

          <div className="rounded border border-neutral-800 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">
              Remaining TAP
            </div>
            <div className="mt-1 text-white">
              {remainingAmount
                ? `${remainingAmount} USDT`
                : "Awaiting amount"}
            </div>
            <div className="mt-1 text-red-300">
              NOT AUTHORIZED
            </div>
          </div>
        </div>

        <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-3 text-xs leading-5 text-neutral-400">
          Five V2-bound VIEW grants will be created: TAP financier, Buyer
          representative review, external review, internal review, and fiduciary
          review. No grant authorizes the remaining TAP.
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-800 pt-4">
          <a
            href={`/admin/control-center/instruments/digital-settlement/${encodeURIComponent(
              reference,
            )}/email-preview?version=2`}
            className="rounded border border-neutral-700 px-3 py-2 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-neutral-500 hover:text-white"
          >
            Review Five V2 Emails
          </a>

          <a
            href="/french-ward/instruments/__preview__?previewMode=buyer&version=2"
            className="rounded border border-neutral-700 px-3 py-2 text-[10px] uppercase tracking-wide text-neutral-300 hover:border-neutral-500 hover:text-white"
          >
            Review V2 Instrument
          </a>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={issueV2FinancierRevision}
            disabled={!canIssueV2 || Boolean(busy)}
            className="rounded border border-amber-800 bg-amber-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 hover:border-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "v2"
              ? "Issuing V2..."
              : currentVersion >= 2
                ? "V2 Issued"
                : "Issue V2 Financier Revision"}
          </button>
        </div>

        {!canIssueV2 && currentVersion === 1 ? (
          <p className="mt-2 text-[11px] leading-5 text-neutral-500">
            V2 issuance is available only while V1 remains issued with fixed
            pricing and the settlement is still awaiting verification transfer.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-neutral-800 bg-black/20 p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Canonical Chain Evidence
        </div>

        <h2 className="mt-1 text-sm font-medium text-white">
          Verification Transfer
        </h2>

        <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
          AXPT derives this evidence from the canonical Ethereum observation
          path. The operator may recognize an eligible transfer, but cannot
          alter its transaction hash, amount, receiving address, block, sender,
          or finality evidence here. Recognition does not authorize the
          remaining Good-Faith TAP.
        </p>

        {settlementStatus === "AWAITING_VERIFICATION_TRANSFER" ? (
          <div className="mt-4">
            {verificationEvidence?.disposition === "MATCHED" &&
            verificationEvidence.candidate ? (
              <div className="space-y-3">
                <div className="rounded border border-emerald-900/70 bg-emerald-950/10 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-400">
                    Eligible Finalized Transfer Matched
                  </div>

                  <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Amount
                      </div>
                      <div className="mt-1 text-white">
                        {verificationEvidence.amountUsdt} USDT
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Network
                      </div>
                      <div className="mt-1 text-white">
                        {verificationEvidence.network}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Receiving Address
                      </div>
                      <div className="mt-1 break-all font-mono text-[11px] text-cyan-300">
                        {verificationEvidence.receivingAddress}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Transaction Hash
                      </div>
                      <div className="mt-1 break-all font-mono text-[11px] text-cyan-300">
                        {verificationEvidence.candidate.transactionHash}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Block
                      </div>
                      <div className="mt-1 font-mono text-white">
                        {verificationEvidence.candidate.blockNumber}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Finality
                      </div>
                      <div className="mt-1 text-white">
                        {verificationEvidence.candidate.confirmationCount}
                        {" / "}
                        {verificationEvidence.candidate.requiredConfirmations}
                        {" confirmations · finalized"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Chain Time
                      </div>
                      <div className="mt-1 text-white">
                        {verificationEvidence.candidate.chainTimestamp}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                        Sender
                      </div>
                      <div className="mt-1 break-all font-mono text-[11px] text-white">
                        {verificationEvidence.candidate.senderAddress}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={confirmVerification}
                  disabled={!canConfirmVerification || Boolean(busy)}
                  className="rounded border border-emerald-900 bg-emerald-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-emerald-300 hover:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === "verification"
                    ? "Recognizing..."
                    : "Recognize Verification"}
                </button>
              </div>
            ) : verificationEvidence?.disposition ===
              "AMBIGUOUS_OBSERVATIONS" ? (
              <div className="rounded border border-amber-900/70 bg-amber-950/10 p-3">
                <div className="text-xs font-medium text-amber-300">
                  Review required
                </div>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  {verificationEvidence.candidateCount ?? "Multiple"} eligible
                  finalized chain observations match this instruction. AXPT
                  will not choose between them automatically.
                </p>
              </div>
            ) : verificationEvidence?.disposition ===
              "AMBIGUOUS_INSTRUCTIONS" ? (
              <div className="rounded border border-amber-900/70 bg-amber-950/10 p-3">
                <div className="text-xs font-medium text-amber-300">
                  Recognition blocked
                </div>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Another live issued settlement instruction has the same
                  verification signature. Operator recognition remains blocked
                  until the instruction ambiguity is resolved.
                </p>

                {verificationEvidence.conflictingInstrumentReferences.length >
                0 ? (
                  <div className="mt-2 font-mono text-[11px] text-neutral-400">
                    {verificationEvidence.conflictingInstrumentReferences.join(
                      ", ",
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded border border-neutral-800 bg-black/30 p-3">
                <div className="text-xs font-medium text-white">
                  Waiting for eligible finalized transfer
                </div>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  No post-issuance, unconsumed, finalized {verificationAmountUsdt}
                  {" USDT "}verification transfer currently satisfies the
                  canonical settlement matcher.
                </p>
              </div>
            )}
          </div>
        ) : verificationConfirmedAt ? (
          <div className="mt-4 rounded border border-emerald-900/70 bg-emerald-950/10 p-3">
            <div className="text-[10px] uppercase tracking-wide text-emerald-400">
              Verification Recognized
            </div>

            <div className="mt-2 text-xs text-white">
              {verificationAmountUsdt} USDT
            </div>

            {verificationTxHash ? (
              <div className="mt-1 break-all font-mono text-[11px] text-cyan-300">
                {verificationTxHash}
              </div>
            ) : null}

            <div className="mt-1 text-[11px] text-neutral-500">
              {verificationConfirmedAt}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded border border-neutral-800 bg-black/30 p-3 text-xs text-neutral-500">
            Canonical verification evidence becomes available after the
            instruction is issued and enters the verification-transfer state.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-neutral-800 bg-black/20 p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Good-Faith TAP Authority
        </div>

        <h2 className="mt-1 text-sm font-medium text-white">
          Authorize Remaining TAP
        </h2>

        <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
          Principal authorization is available only after verification is
          confirmed and pricing is fixed. The domain command re-checks those
          conditions server-side before advancing the instrument.
        </p>

        <div className="mt-4 grid gap-2 text-xs text-neutral-400 md:grid-cols-2">
          <div className="rounded border border-neutral-800 bg-black/30 p-3">
            Pricing status:{" "}
            <span
              className={
                pricingStatus === "FIXED"
                  ? "text-emerald-300"
                  : "text-amber-300"
              }
            >
              {pricingStatus}
            </span>
          </div>

          <div className="rounded border border-neutral-800 bg-black/30 p-3">
            Remaining amount:{" "}
            <span className="text-white">
              {remainingAmount
                ? `${remainingAmount} USDT`
                : "Awaiting price fixing"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={authorizePrincipal}
            disabled={!canAuthorizePrincipal || Boolean(busy)}
            className="rounded border border-cyan-900 bg-cyan-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-cyan-300 hover:border-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "principal"
              ? "Authorizing..."
              : principalAlreadyAuthorized
                ? "TAP Authorized"
                : "Authorize Remaining TAP"}
          </button>
        </div>
      </section>

      {message ? (
        <div className="rounded border border-emerald-900 bg-emerald-950/20 p-3 text-xs text-emerald-300">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-red-900 bg-red-950/20 p-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}
