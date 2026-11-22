import ControlDomainSurface from "@/components/admin/control-center/ControlDomainSurface";
export default function DomainPage() {
  return <ControlDomainSurface title="Execution" description="Control Center · Execution">
    <section className="rounded-lg border border-neutral-700 p-5">
      <h2>Surface pending implementation</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-400">A dedicated execution surface is not implemented here. Use Command’s Execution mode to inspect a selected dossier.</p>
    </section>
  </ControlDomainSurface>;
}
