// app/portal/elder/page.tsx
import Link from 'next/link';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export default async function ElderHome() {
  await requireElderServer();
  return (
    <main className="min-h-screen p-8 text-white bg-black">
      <h1 className="text-3xl mb-6">Council Chamber</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/portal/elder/proposals" className="block rounded-xl border p-6 hover:bg-white/5">
          <h2 className="text-xl">Proposals</h2>
          <p className="text-sm text-zinc-400">Review, vote, and observe timelocks.</p>
        </Link>
        <Link href="/portal/elder/issuance" className="block rounded-xl border p-6 hover:bg-white/5">
          <h2 className="text-xl">Token Issuance</h2>
          <p className="text-sm text-zinc-400">Approve DAO token requests post‑timelock.</p>
        </Link>
      </div>
    </main>
  );
}