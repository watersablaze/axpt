// app/dev/initiation/page.tsx
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import DevBanner from '@/components/dev/DevBanner';

export default async function DevInitiationPreview() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/portal/initiation');
  }

  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { name: true, email: true, tier: true, createdAt: true },
  });

  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      <DevBanner note="Initiation ceremony preview. Hidden in production." />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(136,96,208,0.25),transparent_55%)]" />
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="flex justify-center mb-8 opacity-90">
          <Image src="/images/axpt-sigil-main.png" alt="AXPT Sigil" width={240} height={240} className="animate-pulse rounded-full" priority />
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Presence Has Been Woven (DEV)</h1>
        <p className="mt-4 text-zinc-300 leading-relaxed">
          This is a dev preview of the initiation ceremony without authentication.
          {user?.name ? <> Welcome, <span className="text-purple-300">{user.name}</span>.</> : null}
        </p>

        <div className="mt-6 space-y-1 text-sm text-zinc-400">
          {user?.email && <p>Identity: <span className="text-zinc-200">{user.email}</span></p>}
          {user?.tier && <p>Tier: <span className="text-zinc-200">{user.tier}</span></p>}
          {user?.createdAt && <p>Residency established: <span className="text-zinc-200">{new Date(user.createdAt).toLocaleString()}</span></p>}
        </div>
      </section>
    </main>
  );
}