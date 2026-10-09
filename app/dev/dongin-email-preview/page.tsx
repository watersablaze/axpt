import { notFound } from "next/navigation";

import {
  buildDonginEscrowResponseEmail,
} from "@/domains/instruments/communications/donginEscrowResponseEmail";

export const dynamic = "force-dynamic";

export default function DonginEmailPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const message =
    buildDonginEscrowResponseEmail();

  return (
    <main className="min-h-screen bg-[#090d0c] px-4 py-8 text-stone-100 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-lg border border-amber-900/60 bg-amber-950/10 p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400">
            Development Preview Only
          </p>

          <h1 className="mt-2 text-lg font-medium text-white">
            DONGIN Escrow Structure & Transaction Activation
          </h1>

          <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-400">
            This page renders the canonical bilingual email builder directly.
            It contains no send control and performs no delivery.
          </p>

          <div className="mt-4 grid gap-2 rounded border border-stone-800 bg-black/25 p-4 text-xs">
            <div>
              <span className="text-stone-500">From: </span>
              <span className="text-white">
                {message.from}
              </span>
            </div>

            <div>
              <span className="text-stone-500">To: </span>
              <span className="text-white">
                {message.to}
              </span>
            </div>

            <div>
              <span className="text-stone-500">Cc: </span>
              <span className="text-white">
                {message.cc.join(", ")}
              </span>
            </div>

            <div>
              <span className="text-stone-500">Subject: </span>
              <span className="text-white">
                {message.subject}
              </span>
            </div>

            <div>
              <span className="text-stone-500">
                Communication:
              </span>{" "}
              <span className="font-mono text-amber-300">
                {message.type}
              </span>
            </div>

            <div>
              <span className="text-stone-500">
                Delivery mode:
              </span>{" "}
              <span className="uppercase text-cyan-300">
                {message.deliveryMode}
              </span>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-stone-800">
          <div className="border-b border-stone-800 bg-black/30 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
              Exact Rendered HTML
            </p>
          </div>

          <div className="bg-[#07110d] p-2 sm:p-4">
            <iframe
              title="DONGIN bilingual email preview"
              srcDoc={message.html}
              sandbox=""
              className="h-[1200px] w-full rounded border-0 bg-[#07110d]"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
