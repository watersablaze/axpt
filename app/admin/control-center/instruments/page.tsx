import { loadControlCenterInstrumentRegistry } from "@/domains/control-center/registries/loadControlCenterInstrumentRegistry";
import InstrumentRegistryExplorer from "./InstrumentRegistryExplorer";

export const dynamic = "force-dynamic";

export default async function ControlCenterInstrumentsPage() {
  // Preserve the established canonical read model and its authorization boundary.
  // Discovery is client-side only; no new data visibility or database writes.
  const instruments = await loadControlCenterInstrumentRegistry();

  return (
    <InstrumentRegistryExplorer
      records={instruments.map((record) => ({
        reference: record.reference,
        kind: record.kind,
        title: record.title,
        status: record.status,
        currentVersion: record.currentVersion,
        domainState: record.domainState,
        counterpartyName: record.counterpartyName,
        operatorHref: record.operatorHref,
      }))}
    />
  );
}
