"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
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
};

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default function DigitalSettlementOperatorPanel({
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
}: Props) {
  const router = useRouter();

  const [transactionHash, setTransactionHash] = useState(
    verificationTxHash ?? "",
  );
  const [observedAmountUsdt, setObservedAmountUsdt] = useState(
    verificationAmountUsdt,
  );
  const [observedReceivingAddress, setObservedReceivingAddress] = useState(
    receivingAddress ?? "",
  );
  const [busy, setBusy] = useState<
    "verification" | "principal" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canConfirmVerification =
    settlementStatus === "AWAITING_VERIFICATION_TRANSFER";

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

  async function confirmVerification() {
    if (!canConfirmVerification || busy) {
      return;
    }

    const confirmed = window.confirm(
      `Confirm the ${verificationAmountUsdt} USDT verification transfer for ${reference}?`,
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
            transactionHash,
            observedAmountUsdt,
            observedReceivingAddress,
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

      <section className="rounded-xl border border-neutral-800 bg-black/20 p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Verification Transfer
        </div>

        <h2 className="mt-1 text-sm font-medium text-white">
          Confirm 50 USDT Verification
        </h2>

        <p className="mt-1 max-w-3xl text-xs leading-5 text-neutral-500">
          Record only verified on-chain evidence. This transition confirms
          receipt of the verification transfer. It does not authorize the
          remaining Good-Faith TAP.
        </p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-[10px] uppercase tracking-wide text-neutral-500">
              Transaction Hash
            </span>
            <input
              value={transactionHash}
              onChange={(event) =>
                setTransactionHash(event.target.value)
              }
              disabled={!canConfirmVerification || Boolean(busy)}
              className="rounded border border-neutral-800 bg-black/40 px-3 py-2 font-mono text-xs text-white disabled:opacity-50"
              placeholder="0x..."
            />
          </label>

          <label className="grid gap-1">
            <span className="text-[10px] uppercase tracking-wide text-neutral-500">
              Observed Amount
            </span>
            <input
              value={observedAmountUsdt}
              onChange={(event) =>
                setObservedAmountUsdt(event.target.value)
              }
              disabled={!canConfirmVerification || Boolean(busy)}
              className="rounded border border-neutral-800 bg-black/40 px-3 py-2 text-xs text-white disabled:opacity-50"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-[10px] uppercase tracking-wide text-neutral-500">
              Observed Receiving Address
            </span>
            <input
              value={observedReceivingAddress}
              onChange={(event) =>
                setObservedReceivingAddress(event.target.value)
              }
              disabled={!canConfirmVerification || Boolean(busy)}
              className="rounded border border-neutral-800 bg-black/40 px-3 py-2 font-mono text-xs text-white disabled:opacity-50"
              placeholder="0x..."
            />
          </label>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={confirmVerification}
            disabled={
              !canConfirmVerification ||
              Boolean(busy) ||
              !transactionHash.trim() ||
              !observedAmountUsdt.trim() ||
              !observedReceivingAddress.trim()
            }
            className="rounded border border-emerald-900 bg-emerald-950/20 px-3 py-2 text-[10px] uppercase tracking-wide text-emerald-300 hover:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "verification"
              ? "Confirming..."
              : verificationConfirmedAt
                ? "Verification Confirmed"
                : "Confirm Verification"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-black/20 p-4">
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
