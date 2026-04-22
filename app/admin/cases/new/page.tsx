import CreateCaseWizard from '@/components/case/CreateCaseWizard';

export default function NewCasePage() {
  return (
    <section className="px-6 py-10 max-w-4xl mx-auto">

      <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6 md:p-8 space-y-6">

      <div className="text-xs text-neutral-500">
        System intelligence will activate after case creation
      </div>
        {/* HEADER */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Initiate Case
          </h1>

          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            Create a new operational container. This will initialize gates,
            artifacts, and system intelligence.
          </p>
        </div>

        {/* WIZARD */}
        <CreateCaseWizard />

        {/* FOOTNOTE */}
        <div className="text-xs text-zinc-500 border-t border-zinc-800 pt-4">
          • Coordination Only: informational custody, no escrow transfer  
          <br />
          • Full Escrow: requires full verification before execution
        </div>

      </div>

    </section>
  );
}