import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

import { CaseHeader } from '@/components/case/CaseHeader';
import { GateTimeline } from '@/components/case/GateTimeline';
import { ArtifactsPanel } from '@/components/case/ArtifactsPanel';
import { EventLogPanel } from '@/components/case/EventLogPanel';
import { EscrowLockBanner } from '@/components/case/EscrowLockBanner';
import { PortalLinkIssuer } from '@/components/case/PortalLinkIssuer';

export default async function CaseWorkspacePage({
  params,
}: {
  params: { caseId: string };
}) {
  const c = await prisma.case.findUnique({
    where: { id: params.caseId },
    include: {
      gates: {
        orderBy: { ord: 'asc' },
        include: {
          items: {
            orderBy: { ord: 'asc' },
          },
        },
      },
      artifacts: {
        orderBy: { createdAt: 'desc' },
      },
      events: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!c) notFound();

  // (Optional) compute here if you want. GateTimeline can also compute it.
  const computedActiveGateOrd =
    c.gates.find((g) => g.status !== 'VERIFIED')?.ord ?? null;

  // Case lock rule: after escrow authorization, no active gate should highlight
  const caseLocked = c.status === 'ESCROW_INITIATED';
  const activeGateOrd = caseLocked ? null : computedActiveGateOrd;

  return (
    <main className="min-h-screen bg-black text-white p-8 space-y-10">
      <EscrowLockBanner status={c.status} />
      <CaseHeader c={c} />

      {/* 🔐 Party Portal Issuance (internal only) */}
      <PortalLinkIssuer caseId={c.id} />

      <GateTimeline
        gates={c.gates}
        role="internal"
        caseStatus={c.status}
        activeGateOrd={activeGateOrd}
      />

      <ArtifactsPanel artifacts={c.artifacts} />
      <EventLogPanel events={c.events} />
    </main>
  );
}