import ControlDomainSurface from "@/components/admin/control-center/ControlDomainSurface";
import DigitalSettlementReceiptAdmissionPanel from "@/components/admin/control-center/treasury/DigitalSettlementReceiptAdmissionPanel";

import OriginateTreasuryTransferPanel from "@/components/admin/control-center/treasury/OriginateTreasuryTransferPanel";

import TransferExecutionSummaryPanel from "@/components/admin/control-center/treasury/TransferExecutionSummaryPanel";

export default function TreasuryPage() {
  return (
    <ControlDomainSurface title="Treasury operating surface"
      description="Formulate and inspect Treasury activity. Authority and execution remain governed by the Treasury Gateway."
      rail={<nav aria-label="Treasury sections">
        <h2>Working sections</h2>
        <a href="#receipt-admission">DSI receipt admission</a>
        <a href="#transfer-origination">Originate transfer</a>
        <a href="#execution-review">Execution review</a>
      </nav>}>
      <section id="receipt-admission" aria-label="DSI receipt admission"><DigitalSettlementReceiptAdmissionPanel /></section>
      <section id="transfer-origination" aria-label="Transfer origination"><OriginateTreasuryTransferPanel /></section>
      <section id="execution-review" aria-label="Execution review"><TransferExecutionSummaryPanel /></section>
    </ControlDomainSurface>
  );
}
