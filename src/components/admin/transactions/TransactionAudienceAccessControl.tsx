"use client";

import { useState } from "react";

type Grant = {
  key:
    | "financier"
    | "buyerRepresentative"
    | "externalReviewer"
    | "bobby"
    | "lawrence";
  recipientName: string;
  email: string;
  accessPurpose: string;
  authority: string;
  accessLevel: string;
  accessUrl: string;
};

type Props = {
  reference: string;
  onLinksReady?: (
    links: Record<string, string>,
  ) => void;
};

export function TransactionAudienceAccessControl({
  reference,
  onLinksReady,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [error, setError] = useState<string | null>(null);

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

    setBusy(true);
    setError(null);
    setGrants([]);

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

      const nextGrants =
        payload.result.grants as Grant[];

      setGrants(nextGrants);

      onLinksReady?.(
        Object.fromEntries(
          nextGrants.map((grant) => [
            grant.key,
            grant.accessUrl,
          ]),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DSI_AUDIENCE_ACCESS_REISSUE_FAILED",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-stone-800 bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
        Audience access
      </p>
      <h3 className="mt-1 text-sm text-white">
        Five Personal Transaction Links
      </h3>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-500">
        Each participant receives a separate V2-bound bearer credential. The
        same transaction record is composed differently according to audience.
        Access does not confer operator authority.
      </p>

      <button
        type="button"
        onClick={rotate}
        disabled={busy}
        className="mt-4 rounded border border-amber-800 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? "Generating..."
          : "Generate Fresh 5 Private Links"}
      </button>

      {grants.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-cyan-300">
            Replacement links · shown in this operator session
          </p>

          {grants.map((grant) => (
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
                {grant.accessUrl}
              </a>
            </article>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded border border-rose-900/50 bg-rose-950/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
