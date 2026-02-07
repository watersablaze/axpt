import CreateCaseWizard from '@/src/components/case/CreateCaseWizard';

export default function NewCasePage() {
  return (
    <section className="px-6 py-10 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          New Custodial Case
        </h1>

        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          This action creates a legal container, initializes all required gates,
          and establishes the case lifecycle. Proceed deliberately.
        </p>

        <div className="mt-6">
          <CreateCaseWizard />
        </div>

        <div className="mt-6 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
          • Coordination Only: informational custody, no escrow transfer  
          <br />
          • Full Escrow: Gate 4 verification required before escrow handoff
        </div>
      </div>
    </section>
  );
}