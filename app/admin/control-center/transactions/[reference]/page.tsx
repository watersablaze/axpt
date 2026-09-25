import Link from "next/link";
import { notFound } from "next/navigation";

import DigitalSettlementOperatorPage from "../../instruments/digital-settlement/[reference]/page";
import {
  INDERAKSH_TRANSACTION_CONTINUITY,
  INDERAKSH_TRANSACTION_REFERENCE,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import { DSI_REFERENCE } from "@/domains/instruments/definitions/digitalSettlementV1Definition";

export const dynamic = "force-dynamic";

const views = [
  ["overview", "Overview"],
  ["documents", "Documents"],
  ["settlement", "Settlement Control"],
  ["access", "Access & Communications"],
  ["evidence", "Evidence / Reconciliation"],
  ["history", "History"],
] as const;

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ view?: string }>;
};

export default async function TransactionOperatorPage({ params, searchParams }: Props) {
  const { reference } = await params;
  if (reference !== INDERAKSH_TRANSACTION_REFERENCE) notFound();
  const requested = (await searchParams).view;
  const view = views.find(([key]) => key === requested)?.[0] ?? "overview";
  const path = `/admin/control-center/transactions/${reference}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 text-stone-100">
      <header className="border-b border-stone-700 py-5">
        <p className="text-xs uppercase tracking-widest text-amber-300">French-Ward · Transaction Console</p>
        <h1 className="mt-2 text-xl">{reference}</h1>
        <p>Inderaksh Gold Refinery FZ-LLC · AWAITING EXECUTION</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-400">
          <span>DOCUMENTS · ISSUED</span><span>EXECUTION · AWAITING</span><span>SETTLEMENT · ACTIVE</span>
        </div>
      </header>
      <nav aria-label="Operator transaction workspaces" className="flex flex-wrap gap-2 border-b border-stone-700 py-3">
        {views.map(([key, label]) => (
          <Link key={key} aria-current={view === key ? "page" : undefined}
            className={`rounded px-3 py-2 text-sm ${view === key ? "bg-amber-800 text-white" : "text-stone-300"}`}
            href={`${path}?view=${key}`}>{label}</Link>
        ))}
      </nav>
      {view === "overview" && <section className="space-y-3 py-6">
        <h2 className="text-lg">Agreement awaiting execution</h2>
        <p>50 KG · Mali → Dubai · Seller: French-Ward, Inc.</p>
        <p>Confirm Buyer signing authority before execution. The DSI settlement layer remains independently active.</p>
      </section>}
      {view === "documents" && <section className="space-y-4 py-6">
        <h2 className="text-lg">Governing documents</h2>
        {INDERAKSH_TRANSACTION_CONTINUITY.governingDocuments.filter((item) => item.kind !== "DSI").map((item) => (
          <article key={item.reference} className="rounded border border-stone-700 p-4">
            <h3>{item.title}</h3><p>{item.reference} · {item.status}</p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label={`${item.title} actions pending storage authority`}>
              {["View", "Download", "Attach / Replace Pre-Issuance", "Issue", "Record Executed Copy"].map((action) => (
                <button key={action} type="button" disabled className="rounded border border-stone-700 px-3 py-1 text-xs text-stone-500">{action}</button>
              ))}
            </div>
            <p className="mt-2 text-sm text-stone-400">Awaiting durable private storage and a governed attachment record.</p>
          </article>
        ))}
      </section>}
      {view === "settlement" && <section className="py-5" aria-label="Settlement control">
        <DigitalSettlementOperatorPage params={Promise.resolve({ reference: DSI_REFERENCE })} />
      </section>}
      {view === "access" && <section className="space-y-3 py-6"><h2 className="text-lg">Access & Communications</h2>
        <p>Existing Buyer access remains attached to the issued DSI. Manage established access through the current operator controls.</p>
        <Link href={`/admin/control-center/instruments/digital-settlement/${DSI_REFERENCE}`}>Open DSI operator surface</Link>
      </section>}
      {view === "evidence" && <section className="space-y-3 py-6"><h2 className="text-lg">Evidence / Reconciliation</h2>
        <p>Observation, verification, and operator recognition remain governed by the existing DSI commands.</p>
        <Link href={`${path}?view=settlement`}>Open Settlement Control</Link>
      </section>}
      {view === "history" && <section className="space-y-3 py-6"><h2 className="text-lg">History</h2>
        <p>Document and transaction event aggregation awaits the governed document record. Existing DSI history remains on the operator surface.</p>
        <Link href={`/admin/control-center/instruments/digital-settlement/${DSI_REFERENCE}`}>Open DSI operator surface</Link>
      </section>}
    </div>
  );
}
