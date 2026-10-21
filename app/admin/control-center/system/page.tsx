import ControlDomainSurface from "@/components/admin/control-center/ControlDomainSurface";
export default function DomainPage() {
  return <ControlDomainSurface title="System oversight" description="Control Center · System oversight">
    <section className="rounded-lg border border-neutral-700 p-5">
      <h2>Surface pending implementation</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-400">A dedicated system telemetry surface is not implemented here.</p>
    </section>
  </ControlDomainSurface>;
}
