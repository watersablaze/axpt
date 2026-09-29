import Link from "next/link";

import { getControlCenterTransactionRegistry } from "@/domains/control-center/registries/controlCenterTransactionRegistry";

export const dynamic = "force-dynamic";

export default function ControlCenterTransactionsPage() {
  const transactions = getControlCenterTransactionRegistry();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-stone-800 pb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
          AXPT Control Center / Transactions
        </p>

        <h1 className="mt-2 text-2xl font-medium text-white">
          Transaction Registry
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-500">
          Governed commercial transaction environments admitted to the
          Control Center. Registry presence does not itself authorize
          execution, settlement, or movement of value.
        </p>
      </header>

      <section className="mt-6 overflow-hidden rounded-lg border border-stone-800">
        <div className="border-b border-stone-800 bg-black/20 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
            Registered transactions · {transactions.length}
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-5 text-sm text-stone-500">
            No governed Control Center transactions are registered.
          </div>
        ) : (
          transactions.map((transaction) => (
            <article
              key={transaction.reference}
              className="border-b border-stone-800 p-5 last:border-b-0"
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-amber-300">
                    {transaction.reference}
                  </p>

                  <h2 className="mt-2 text-base font-medium text-white">
                    {transaction.label}
                  </h2>

                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                    <div>
                      <p className="text-stone-600">Transaction</p>
                      <p className="mt-1 text-stone-300">
                        {transaction.transactionState}
                      </p>
                    </div>

                    <div>
                      <p className="text-stone-600">Documents</p>
                      <p className="mt-1 text-stone-300">
                        {transaction.documentState}
                      </p>
                    </div>

                    <div>
                      <p className="text-stone-600">Settlement</p>
                      <p className="mt-1 text-stone-300">
                        {transaction.settlementState}
                      </p>
                    </div>
                  </div>

                  {transaction.instrumentReferences.length > 0 ? (
                    <p className="mt-4 text-[10px] uppercase tracking-[0.12em] text-stone-600">
                      Instruments ·{" "}
                      <span className="font-mono text-stone-400">
                        {transaction.instrumentReferences.join(", ")}
                      </span>
                    </p>
                  ) : null}
                </div>

                <Link
                  href={transaction.operatorHref}
                  className="inline-flex border border-stone-700 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-stone-300 transition hover:border-amber-700 hover:text-amber-300"
                >
                  Open transaction
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
