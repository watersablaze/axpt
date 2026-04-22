// src/components/deal-room/DealRoomLayout.tsx
import CaseHeader from "@/components/cases/workspace/CaseHeader";
import GateTimeline from "./GateTimeline";
import DocumentVault from "./DocumentVault";
import EscrowPanel from "./EscrowPanel";
import EventStream from "./EventStream";
import type { CaseData } from "@/shared/types/case";
import OperatorTimeline from "./OperatorTimeline"

type Props = {
  caseData: CaseData;
};

export default function DealRoomLayout({ caseData }: Props) {
  return (
    <div className="space-y-6">
      <CaseHeader caseData={caseData} />
      <OperatorTimeline caseId={caseData.id} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <GateTimeline caseId={caseData.id} />
        <DocumentVault caseId={caseData.id} />
        <EscrowPanel caseId={caseData.id} />
        <EventStream caseId={caseData.id} />
      </div>
    </div>
  );
}