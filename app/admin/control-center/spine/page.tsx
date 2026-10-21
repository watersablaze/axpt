import ControlDomainSurface from "@/components/admin/control-center/ControlDomainSurface";
export default function DomainPage() {
  return <ControlDomainSurface title="Execution lineage" description="Control Center · Execution lineage">
    <section className="rounded-lg border border-neutral-700 p-5">
      <h2>Surface pending implementation</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-400">This route does not yet provide the execution lineage visualization.</p>
    </section>
  </ControlDomainSurface>;
}
