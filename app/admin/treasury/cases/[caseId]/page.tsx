// app/admin/treasury/cases/[caseId]/page.tsx
import { prisma } from "@/lib/prisma";
import DealRoomLayout from "@/components/deal-room/DealRoomLayout";
import type { CaseData } from "@/shared/types/case";

export default async function TreasuryCaseDetailPage({
  params,
}: {
  params: { caseId: string };
}) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: params.caseId },
  });

  if (!caseRecord) {
    return <div className="p-6 text-sm text-neutral-400">Case not found.</div>;
  }

  const caseData: CaseData = {
    id: caseRecord.id,
    title: caseRecord.title,
    status: caseRecord.status as CaseData["status"],
    jurisdiction: caseRecord.jurisdiction,
    createdAt: caseRecord.createdAt.toISOString(),
  };

  return <DealRoomLayout caseData={caseData} />;
}