import Link from "next/link";

import {
  DonginEscrowResponseControl,
} from "@/components/admin/transactions/DonginEscrowResponseControl";

export const dynamic = "force-dynamic";

export default function DonginCorrespondencePage() {
  return (
    <div className="min-h-screen bg-[#090d0c] text-stone-100">
      <header className="sticky top-0 z-30 border-b border-stone-800 bg-[#090d0c]/95 backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
          <p className="text-[9px] uppercase tracking-[0.2em] text-amber-300">
            French-Ward · Communications Control
          </p>

          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-medium text-white">
                DONGIN TRADE HOLDINGS
              </h1>

              <p className="mt-1 text-xs text-stone-500">
                Governed counterparty correspondence
              </p>
            </div>

            <div className="rounded-sm border border-amber-900/70 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] text-amber-300">
              Operator Control
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-5 px-4 py-6 sm:px-6">
        <section className="border-b border-stone-800 pb-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
            Current Correspondence
          </p>

          <h2 className="mt-2 text-base font-medium text-white">
            U.S. Escrow Structure & Transaction Activation
          </h2>

          <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-500">
            One bilingual English and Korean communication to the Buyer,
            representatives and French-Ward internal recipients. Delivery
            creates correspondence evidence only and does not alter settlement,
            document or transaction authority.
          </p>
        </section>

        <DonginEscrowResponseControl />

        <section className="rounded border border-stone-800 bg-black/15 p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-stone-600">
            Delivery Doctrine
          </p>

          <p className="mt-2 max-w-3xl text-xs leading-5 text-stone-500">
            Preview before delivery. Operator authorizes send. Resend performs
            external delivery. EmailLog records delivery evidence. Correspondence
            alone creates no settlement or transaction authority.
          </p>
        </section>

        <Link
          href="/admin/communications"
          className="inline-flex text-[10px] uppercase tracking-wide text-stone-500 hover:text-amber-300"
        >
          Back to Communications
        </Link>
      </main>
    </div>
  );
}
