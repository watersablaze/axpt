import OriginateTreasuryTransferPanel from "@/components/admin/control-center/treasury/OriginateTreasuryTransferPanel";

import TransferExecutionSummaryPanel from "@/components/admin/control-center/treasury/TransferExecutionSummaryPanel";

export default function TreasuryPage() {
  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-5 text-neutral-200">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="border-b border-neutral-900 pb-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-600">
            AXPT Control Center / Treasury
          </div>

          <h1 className="mt-2 text-2xl font-medium text-white">
            Treasury Operating Surface
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
            Operator-facing origination and perception of canonical Treasury
            state. The Control Center may formulate and observe Treasury
            activity, while Treasury law remains within the Gateway.
          </p>
        </header>

        <OriginateTreasuryTransferPanel />

        <TransferExecutionSummaryPanel />
      </div>
    </main>
  );
}
