// app/portal/elder/issuance/page.tsx
import { prisma } from '@/lib/prisma';
import IssuanceRow from '@/components/elder/IssuanceRow';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export default async function ElderIssuancePage() {
  await requireElderServer(); // SSR guard for elders

  const requests = await prisma.tokenIssuanceRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, symbol: true, name: true, status: true, createdAt: true, approvedTokenId: true },
  });

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-2xl font-semibold">Token Issuance (Elder)</h1>
      <p className="text-sm text-zinc-400 mt-1">Review and approve requests.</p>
      <div className="mt-6 space-y-3">
        {requests.length === 0 ? (
          <p className="text-sm text-zinc-400">No requests yet.</p>
        ) : (
          requests.map(r => <IssuanceRow key={r.id} r={{ ...r, createdAt: r.createdAt.toISOString() }} />)
        )}
      </div>
    </main>
  );
}