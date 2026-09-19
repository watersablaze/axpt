import { notFound } from "next/navigation";

import {
  buildDigitalSettlementEmailPreview,
  DIGITAL_SETTLEMENT_EMAIL_EVENT,
} from "@/domains/instruments/communications/sendDigitalSettlementStateEmail";
import {
  DIGITAL_SETTLEMENT_RECIPIENTS,
} from "@/domains/instruments/communications/digitalSettlementRecipients";
import {
  DSI_PUBLIC_ID,
  DSI_REFERENCE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    reference: string;
  }>;
};

export default async function DigitalSettlementEmailPreviewPage({
  params,
}: PageProps) {
  const { reference } = await params;

  if (reference !== DSI_REFERENCE) {
    notFound();
  }

  const placeholderAccessUrl =
    `https://www.axpt.io/french-ward/instruments/` +
    `${DSI_PUBLIC_ID}/access/[PRIVATE-ACCESS-TOKEN]`;

  const preview =
    buildDigitalSettlementEmailPreview({
      event:
        DIGITAL_SETTLEMENT_EMAIL_EVENT.ISSUED,
      reference: DSI_REFERENCE,
      accessUrl: placeholderAccessUrl,
      verificationAmountUsdt: "50",
    });

  const sender =
    "AXPT <connect@axpt.io>";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-neutral-800 bg-black/30 p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
          Digital Settlement Instrument
        </div>

        <h1 className="mt-2 text-xl font-medium text-white">
          Email Preview
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
          These previews use the same canonical message builder and HTML
          renderer as the live DSI communication path. No email is sent from
          this page.
        </p>

        <div className="mt-4 rounded border border-amber-900/60 bg-amber-950/10 p-3 text-xs text-amber-300">
          The private link below contains a placeholder token. The real bearer
          URL is generated only when the instrument is issued.
        </div>
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
            <span className="text-white">
              {DIGITAL_SETTLEMENT_RECIPIENTS.buyer.name}
              {" <"}
              {DIGITAL_SETTLEMENT_RECIPIENTS.buyer.email}
              {">"}
            </span>
          </div>

          <div>
            <span className="text-neutral-600">Subject: </span>
            <span className="text-white">
              {preview.buyer.subject}
            </span>
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
                .map(
                  (recipient) =>
                    `${recipient.name} <${recipient.email}>`,
                )
                .join(", ")}
            </span>
          </div>

          <div>
            <span className="text-neutral-600">Subject: </span>
            <span className="text-white">
              {preview.internal.subject}
            </span>
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
