// app/portal/initiation/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { decodeSessionToken } from '@/lib/auth/session';

export default async function InitiationPage() {
  const jar = await cookies();
  const raw = jar.get('axpt_session')?.value;
  if (!raw) redirect('/'); // or back to onboarding

  const payload = await decodeSessionToken(raw);
  if (!payload?.userId) redirect('/');

  // light fetch (optional; just to display the name / email)
  const user = await prisma.user.findUnique({
    where: { id: String(payload.userId) },
    select: { name: true, email: true, tier: true, createdAt: true },
  });

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      {/* subtle background field */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(136,96,208,0.25),transparent_55%)]" />

      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="flex justify-center mb-8 opacity-90">
          <Image
            src="/images/axpt-sigil-main.png"
            alt="AXPT Sigil"
            width={240}
            height={240}
            className="animate-pulse rounded-full"
            priority
          />
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Your Presence Has Been Woven
        </h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          The gate has opened. You are now a native of the AXPT constellation.
          {user?.name ? <> Welcome, <span className="text-purple-300">{user.name}</span>.</> : null}
        </p>

        <div className="mt-6 space-y-1 text-sm text-zinc-400">
          {user?.email && <p>Identity: <span className="text-zinc-200">{user.email}</span></p>}
          {user?.tier && <p>Tier: <span className="text-zinc-200">{user.tier}</span></p>}
          {user?.createdAt && (
            <p>Residency established: <span className="text-zinc-200">{new Date(user.createdAt).toLocaleString()}</span></p>
          )}
        </div>

        <div className="mt-10">
          <Link
            href="/portal"
            className="inline-flex items-center justify-center rounded-xl border border-purple-500/60 bg-purple-500/10 px-6 py-3 text-lg font-medium hover:bg-purple-500/20 transition"
          >
            Enter Your Portal →
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          A soft hum gathers. Follow the pulse within.
        </p>
      </section>
    </main>
  );
}