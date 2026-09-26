"use client";

import { useMemo, useState } from "react";

type AudienceKey =
  | "financier"
  | "buyerRepresentative"
  | "externalReviewer"
  | "bobby"
  | "lawrence";

type Grant = {
  key: AudienceKey;
  recipientName: string;
  email: string;
  accessPurpose: string;
  authority: string;
  accessLevel: string;
  accessUrl: string;
};

type EmailPreview = {
  key: AudienceKey;
  to: string;
  recipientName: string;
  subject: string;
  heading: string;
  surface: string;
  authority: string;
  lines: readonly string[];
  html: string;
};

type Props = {
  reference: string;
  transactionReference: string;
};

const audienceOrder: AudienceKey[] = [
  "buyerRepresentative",
  "financier",
  "externalReviewer",
  "bobby",
  "lawrence",
];

export function TransactionAudienceAccessControl({
  reference,
  transactionReference,
}: Props) {
  const [busy, setBusy] = useState<
    "rotate" | "preview" | "send" | null
  >(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [previews, setPreviews] = useState<EmailPreview[]>([]);
  const [deliveryMode, setDeliveryMode] =
    useState<"send" | "log" | null>(null);
  const [selectedPreview, setSelectedPreview] =
    useState<AudienceKey>("buyerRepresentative");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accessUrls = useMemo(
    () =>
      Object.fromEntries(
        grants.map((grant) => [
          grant.key,
          grant.accessUrl,
        ]),
      ),
    [grants],
  );

  async function rotate() {
    if (busy) {
      return;
    }

    const confirmed = window.confirm(
      [
        "Generate five fresh private transaction links?",
        "",
        "This will revoke the current V2 links for:",
        "Corey Keller",
        "Carl Albert Meisterlin",
        "Dr. Don C. Hinds",
        "Bobby",
        "Lawrence",
        "",
        "Each replacement link is personal and should not be forwarded.",
        "Settlement state and TAP authority will not change.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    setBusy("rotate");
    setError(null);
    setMessage(null);
    setGrants([]);
    setPreviews([]);
    setDeliveryMode(null);

    try {
      const response = await fetch(
        `/api/admin/instruments/digital-settlement/${encodeURIComponent(reference)}/reissue-audience-access`,
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
            "DSI_AUDIENCE_ACCESS_REISSUE_FAILED",
        );
      }

      setGrants(payload.result.grants as Grant[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DSI_AUDIENCE_ACCESS_REISSUE_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }

  async function emailAction(
    action: "preview" | "send",
  ) {
    if (
      grants.length !== audienceOrder.length ||
      busy
    ) {
      return;
    }

    if (action === "send") {
      const confirmed = window.confirm(
        [
          "Send five personal transaction-access emails now?",
          "",
          "Corey Keller · Buyer Representative",
          "Carl Albert Meisterlin · TAP Financier",
          "Dr. Don C. Hinds · External Review",
          "Bobby · Internal Operations",
          "Lawrence · Fiduciary Review",
          "",
          "Each email carries that recipient's personal private link.",
          "No settlement or document state will change.",
        ].join("\n"),
      );

      if (!confirmed) {
        return;
      }
    }

    setBusy(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/transactions/${encodeURIComponent(transactionReference)}/audience-release`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            accessUrls,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.detail ??
            payload.error ??
            "TRANSACTION_AUDIENCE_RELEASE_FAILED",
        );
      }

      if (action === "preview") {
        setPreviews(
          payload.result.messages as EmailPreview[],
        );
        setDeliveryMode(
          payload.result.deliveryMode as "send" | "log",
        );
        return;
      }

      const results =
        payload.result.delivery as Array<{
          key: AudienceKey;
          alreadyDelivered?: boolean;
        }>;

      const already = results.filter(
        (result) => result.alreadyDelivered,
      ).length;

      setMessage(
        already === results.length
          ? "All five audience emails were already delivered for these access grants."
          : `Audience access emails processed. ${results.length - already} sent; ${already} already delivered.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "TRANSACTION_AUDIENCE_RELEASE_FAILED",
      );
    } finally {
      setBusy(null);
    }
  }

  const activePreview =
    previews.find(
      (preview) =>
        preview.key === selectedPreview,
    ) ?? previews[0];

  return (
    <section className="rounded-lg border border-stone-800 bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
        Audience access & communications
      </p>
      <h3 className="mt-1 text-sm text-white">
        Five Personal Transaction Surfaces
      </h3>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-500">
        Each participant receives a separate V2-bound private link. The same
        transaction record is composed according to audience: Buyer, Financier,
        External Review, Internal Operations, and Fiduciary Review. Access does
        not confer operator authority.
      </p>

      <button
        type="button"
        onClick={rotate}
        disabled={Boolean(busy)}
        className="mt-4 rounded border border-amber-800 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy === "rotate"
          ? "Generating..."
          : "Generate Fresh 5 Private Links"}
      </button>

      {grants.length > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 xl:grid-cols-2">
            {audienceOrder.map((key) => {
              const grant = grants.find(
                (item) => item.key === key,
              );

              if (!grant) {
                return null;
              }

              return (
                <article
                  key={grant.key}
                  className="rounded border border-stone-800 bg-black/25 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-white">
                        {grant.recipientName}
                      </p>
                      <p className="mt-1 text-[10px] text-stone-500">
                        {grant.email} · {grant.accessPurpose}
                      </p>
                    </div>
                    <span className="text-[9px] uppercase tracking-wide text-stone-500">
                      {grant.accessLevel}
                    </span>
                  </div>

                  <a
                    href={grant.accessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all font-mono text-[10px] leading-5 text-cyan-200 underline underline-offset-4"
                  >
                    Open personal surface
                  </a>
                </article>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-stone-800 pt-4">
            <button
              type="button"
              onClick={() => emailAction("preview")}
              disabled={Boolean(busy)}
              className="rounded border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-wide text-stone-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "preview"
                ? "Preparing..."
                : "Preview All 5 Emails"}
            </button>

            <button
              type="button"
              onClick={() => emailAction("send")}
              disabled={
                Boolean(busy) ||
                previews.length !== audienceOrder.length ||
                deliveryMode !== "send"
              }
              className="rounded border border-amber-800 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "send"
                ? "Sending..."
                : "Send 5 Personal Emails"}
            </button>

            {deliveryMode ? (
              <span
                className={
                  deliveryMode === "send"
                    ? "self-center text-[9px] uppercase tracking-wide text-cyan-300"
                    : "self-center text-[9px] uppercase tracking-wide text-stone-500"
                }
              >
                {deliveryMode === "send"
                  ? "Live send enabled"
                  : "Log mode only"}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {previews.length > 0 && activePreview ? (
        <section className="mt-4 overflow-hidden rounded border border-stone-800 bg-black/25">
          <div className="border-b border-stone-800 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-stone-500">
              Rendered delivery previews
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Exact HTML generated by the five-recipient send path.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {audienceOrder.map((key) => {
                const preview = previews.find(
                  (item) => item.key === key,
                );

                if (!preview) {
                  return null;
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setSelectedPreview(key)
                    }
                    className={
                      selectedPreview === key
                        ? "rounded border border-amber-700 bg-amber-950/20 px-3 py-1.5 text-[10px] uppercase tracking-wide text-amber-300"
                        : "rounded border border-stone-700 px-3 py-1.5 text-[10px] uppercase tracking-wide text-stone-400"
                    }
                  >
                    {preview.recipientName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[310px_minmax(0,1fr)]">
            <article className="border-b border-stone-800 p-4 xl:border-r xl:border-b-0">
              <p className="text-[10px] uppercase tracking-wide text-stone-500">
                {activePreview.surface}
              </p>
              <p className="mt-2 text-xs text-stone-500">
                To: {activePreview.to}
              </p>
              <h4 className="mt-2 text-sm text-white">
                {activePreview.subject}
              </h4>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-amber-300">
                {activePreview.authority}
              </p>
              <div className="mt-3 space-y-2 text-xs leading-5 text-stone-400">
                {activePreview.lines.map(
                  (line, index) => (
                    <p key={index}>{line}</p>
                  ),
                )}
              </div>
            </article>

            <div className="bg-[#07110d] p-2 sm:p-4">
              <iframe
                title={`Rendered email for ${activePreview.recipientName}`}
                srcDoc={activePreview.html}
                sandbox=""
                className="h-[760px] w-full rounded border-0 bg-[#07110d]"
              />
            </div>
          </div>
        </section>
      ) : null}

      {message ? (
        <p className="mt-4 rounded border border-cyan-900/50 bg-cyan-950/10 p-3 text-xs text-cyan-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded border border-rose-900/50 bg-rose-950/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
