import { notFound } from "next/navigation";

import { buildDigitalSettlementV2EmailPreviews } from "@/domains/instruments/communications/digitalSettlementV2Preview";
import {
  buildDigitalSettlementEmailPreview,
  DIGITAL_SETTLEMENT_EMAIL_EVENT,
  getDigitalSettlementSender,
} from "@/domains/instruments/communications/sendDigitalSettlementStateEmail";
import { DIGITAL_SETTLEMENT_RECIPIENTS } from "@/domains/instruments/communications/digitalSettlementRecipients";
import {
  DSI_PUBLIC_ID,
  DSI_REFERENCE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { DSI_V2_FINANCIER_REVISION } from "@/domains/instruments/definitions/digitalSettlementV2FinancierRevision";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ reference: string }>;
  searchParams?: Promise<{ version?: string }>;
};

function RecipientLine({
  name,
  email,
}: Readonly<{ name: string; email: string }>) {
  return (
    <span className="text-white">
      {name}
      {" <"}
      {email}
      {">"}
    </span>
  );
}

export default async function DigitalSettlementEmailPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { reference } = await params;
  const query = await searchParams;

  if (reference !== DSI_REFERENCE) {
    notFound();
  }

  const sender = getDigitalSettlementSender();
  const previewV2 = query?.version === "2";

  if (previewV2) {
    const base = `https://www.axpt.io/french-ward/instruments/${DSI_PUBLIC_ID}/access/`;
    const previews = buildDigitalSettlementV2EmailPreviews({
      accessUrls: {
        financier: `${base}[CARL-PRIVATE-TOKEN]`,
        buyerRepresentative: `${base}[COREY-REVIEW-TOKEN]`,
        externalReviewer: `${base}[HINDS-REVIEW-TOKEN]`,
        bobby: `${base}[BOBBY-REVIEW-TOKEN]`,
        lawrence: `${base}[LAWRENCE-REVIEW-TOKEN]`,
      },
    });

    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-xl border border-amber-900/70 bg-amber-950/10 p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-amber-400">
            Preview Only / Simulated Post-Issuance Copy
          </div>
          <h1 className="mt-2 text-xl font-medium text-white">
            DSI Version 2 - Financier Revision Communications
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-neutral-400">
            V1 remains preserved. These five individualized messages simulate
            the exact post-issuance communications that would be rendered only
            after an authorized V2 supersession has committed successfully.
            Their wording intentionally reflects the post-commit state. This
            preview page cannot send email, create or revoke access, supersede
            a version, or modify the DSI lifecycle.
          </p>
          <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
            <div className="rounded border border-neutral-800 bg-black/20 p-3">
              <span className="text-neutral-500">Revision basis: </span>
              <span className="text-neutral-200">
                {DSI_V2_FINANCIER_REVISION.revisionBasis}
              </span>
            </div>
            <div className="rounded border border-neutral-800 bg-black/20 p-3">
              <span className="text-neutral-500">Preserved boundary: </span>
              <span className="text-neutral-200">
                Commercial snapshot, receiving wallet, verification amount, TAP
                authority, and observer doctrine.
              </span>
            </div>
          </div>
        </section>

        {previews.map((preview) => (
          <section
            key={preview.recipientKey}
            className="rounded-xl border border-neutral-800 bg-black/20 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {preview.audience === "ACTIVE"
                    ? "Active Financier Communication"
                    : preview.audience === "INTERNAL"
                      ? "Internal Review Communication"
                      : "External Review Communication"}
                </div>
                <h2 className="mt-2 text-lg font-medium text-white">
                  {preview.recipient.name}
                </h2>
              </div>
              <div
                className={`rounded border px-3 py-2 text-[10px] uppercase tracking-wide ${preview.audience === "ACTIVE" ? "border-amber-800 text-amber-300" : "border-cyan-900 text-cyan-300"}`}
              >
                {preview.audience === "ACTIVE"
                  ? "Active Response"
                  : "Review Only"}
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-xs text-neutral-400">
              <div>
                <span className="text-neutral-600">From: </span>
                <span className="text-white">{sender}</span>
              </div>
              <div>
                <span className="text-neutral-600">To: </span>
                <RecipientLine
                  name={preview.recipient.name}
                  email={preview.recipient.email}
                />
              </div>
              <div>
                <span className="text-neutral-600">Subject: </span>
                <span className="text-white">{preview.subject}</span>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-neutral-800 bg-white">
              <iframe
                title={`${preview.recipient.name} V2 email preview`}
                srcDoc={preview.html}
                sandbox=""
                className="h-[760px] w-full bg-white"
              />
            </div>
          </section>
        ))}
      </div>
    );
  }

  const placeholderAccessUrl = `https://www.axpt.io/french-ward/instruments/${DSI_PUBLIC_ID}/access/[PRIVATE-ACCESS-TOKEN]`;
  const preview = buildDigitalSettlementEmailPreview({
    event: DIGITAL_SETTLEMENT_EMAIL_EVENT.ISSUED,
    reference: DSI_REFERENCE,
    accessUrl: placeholderAccessUrl,
    verificationAmountUsdt: "50",
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-neutral-800 bg-black/30 p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Digital Settlement Instrument
        </div>
        <h1 className="mt-2 text-xl font-medium text-white">Email Preview</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
          Canonical V1 issuance preview. No email is sent from this page.
        </p>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-black/20 p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Buyer Communication
        </div>
        <div className="mt-4 grid gap-2 text-xs text-neutral-400">
          <div>
            <span className="text-neutral-600">From: </span>
            <span className="text-white">{sender}</span>
          </div>
          <div>
            <span className="text-neutral-600">To: </span>
            <RecipientLine
              name={DIGITAL_SETTLEMENT_RECIPIENTS.buyer.name}
              email={DIGITAL_SETTLEMENT_RECIPIENTS.buyer.email}
            />
          </div>
          <div>
            <span className="text-neutral-600">Subject: </span>
            <span className="text-white">{preview.buyer.subject}</span>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border border-neutral-800 bg-white">
          <iframe
            title="Buyer email preview"
            srcDoc={preview.buyer.html}
            sandbox=""
            className="h-[620px] w-full bg-white"
          />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-black/20 p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Internal Communication
        </div>
        <div className="mt-4 grid gap-2 text-xs text-neutral-400">
          <div>
            <span className="text-neutral-600">From: </span>
            <span className="text-white">{sender}</span>
          </div>
          <div>
            <span className="text-neutral-600">To: </span>
            <span className="text-white">
              {DIGITAL_SETTLEMENT_RECIPIENTS.internal
                .map((recipient) => `${recipient.name} <${recipient.email}>`)
                .join(", ")}
            </span>
          </div>
          <div>
            <span className="text-neutral-600">Subject: </span>
            <span className="text-white">{preview.internal.subject}</span>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border border-neutral-800 bg-white">
          <iframe
            title="Internal email preview"
            srcDoc={preview.internal.html}
            sandbox=""
            className="h-[500px] w-full bg-white"
          />
        </div>
      </section>
    </div>
  );
}
