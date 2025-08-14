// app/portal/elder/proposals/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { requireElderServer } from '@/lib/auth/requireElderServer';

function chip(c:string){return `inline-block px-2 py-0.5 rounded-full text-xs border ${c}`}

export default async function ProposalsPage() {
  await requireElderServer();
  const proposals = await prisma.governanceProposal.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id:true, title:true, status:true, createdAt:true, votingEndsAt:true, readyAt:true, quorum:true, approvalThreshold:true },
  });

  return (
    <main className="min-h-screen p-8 text-white bg-black">
      <h1 className="text-2xl mb-6">Proposals</h1>
      <div className="space-y-3">
        {proposals.map(p=>(
          <Link key={p.id} href={`/portal/elder/proposals/${p.id}`} className="block rounded-xl border p-4 hover:bg-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg">{p.title}</h3>
              <span className={chip('border-zinc-600')}>{p.status}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Quorum {p.quorum ?? '—'} · Approvals {p.approvalThreshold ?? '—'}</p>
            {p.readyAt && <p className="text-xs text-emerald-400 mt-1">Ready at {new Date(p.readyAt).toLocaleString()}</p>}
            {p.votingEndsAt && <p className="text-xs text-zinc-400">Voting ends {new Date(p.votingEndsAt).toLocaleString()}</p>}
          </Link>
        ))}
      </div>
    </main>
  );
}