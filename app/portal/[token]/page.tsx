import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyPublicToken } from '@/lib/axpt/verifyPublicToken';
import { GateTimeline } from '@/components/case/GateTimeline';

type PageProps = {
  params: { token: string };
};

export default async function PartyPortalPage({ params }: PageProps) {
  const payload = verifyPublicToken(params.token);
  if (!payload) notFound();

  const c = await prisma.case.findUnique({
    where: { id: payload.caseId },
    include: {
      gates: {
        orderBy: { ord: 'asc' },
        include: {
          items: {
            orderBy: { ord: 'asc' },
          },
        },
      },
    },
  });

  if (!c) notFound();

  const activeGateOrd =
    c.gates.find(g => g.status !== 'VERIFIED')?.ord ?? null;

  // 🔐 Role-derived copy (single source of truth)
  const roleLabel =
    payload.role === 'SELLER'
      ? 'Seller'
      : payload.role === 'BUYER'
      ? 'Buyer'
      : 'Party';

  return (
    <main className="max-w-4xl mx-auto py-12 px-6 space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {roleLabel} Document Portal
        </h1>

        <p className="text-sm text-white/60">
          {c.title} — {c.jurisdiction}
        </p>

        <p className="text-xs text-white/40 max-w-xl leading-relaxed">
          This portal is used by the {roleLabel.toLowerCase()} to submit
          documents required for procedural verification.
          <br />
          AXPT does not custody funds, authorize transactions, or provide
          legal or financial advice.
        </p>

        {activeGateOrd && (
          <p className="text-xs text-white/50">
            <span className="font-medium text-white/70">
              Current verification step:
            </span>{' '}
            Gate {activeGateOrd}
          </p>
        )}
      </header>

      {/* Gates */}
      <GateTimeline
        gates={c.gates}
        activeGateOrd={activeGateOrd}
        mode="party"
      />

      {/* Footer */}
      <footer className="text-xs text-white/40">
        Procedural verification only.
      </footer>
    </main>
  );
}