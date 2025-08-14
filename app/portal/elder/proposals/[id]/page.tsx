// app/portal/elder/proposals/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';
import VotePanel from '@/components/elder/VotePanel';

type Params = { params: { id: string } };

export default async function ElderProposalDetail({ params }: Params) {
  await requireElderServer();

  const proposal = await prisma.governanceProposal.findUnique({
    where: { id: params.id },
    include: {
      authorElder: { select: { id: true, user: { select: { name: true, email: true } } } },
      votes: { include: { elder: { select: { user: { select: { name: true, email: true } } } } } },
    },
  });

  if (!proposal) {
    return (
      <main className="min-h-screen bg-black text-white px-6 py-10">
        <h1 className="text-xl">Proposal not found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-2xl font-semibold">{proposal.title}</h1>
      <p className="text-sm text-zinc-400 mt-1">{proposal.status}</p>

      <section className="mt-4 space-y-2">
        {proposal.description && <p className="text-zinc-300">{proposal.description}</p>}
        <div className="text-xs text-zinc-500">
          Created: {new Date(proposal.createdAt).toLocaleString()}
          {proposal.votingEndsAt && <> • Voting ends: {new Date(proposal.votingEndsAt).toLocaleString()}</>}
          {proposal.readyAt && <> • Ready at: {new Date(proposal.readyAt).toLocaleString()}</>}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Votes</h2>
        <ul className="mt-2 space-y-1">
          {proposal.votes.map(v => (
            <li key={v.id} className="text-sm text-zinc-300">
              {v.elder.user?.name || 'Elder'} — {v.choice.toUpperCase()}
            </li>
          ))}
        </ul>

        {/* client-only panel */}
        <VotePanel proposalId={proposal.id} />
      </section>
    </main>
  );
}