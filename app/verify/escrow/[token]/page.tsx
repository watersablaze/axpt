import { notFound } from 'next/navigation';

type PageProps = {
  params: { token: string };
};

async function fetchVerification(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/axpt/public/verify?token=${token}`,
    { cache: 'no-store' }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function EscrowVerificationPage({ params }: PageProps) {
  const data = await fetchVerification(params.token);
  if (!data || !data.ok) notFound();

  const {
    case: c,
    proceduralReadiness,
    verification,
    disclaimer,
  } = data;

  const revoked = verification.status === 'REVOKED';

  return (
    <main className="max-w-3xl mx-auto py-16 px-6 space-y-10 text-white">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Escrow Verification Summary
        </h1>
        <p className="text-sm text-white/60">
          {c.title} — {c.jurisdiction}
        </p>
      </header>

      <section className="border border-white/10 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Status</span>
          <span
            className={
              revoked
                ? 'text-red-400'
                : proceduralReadiness.verified
                ? 'text-green-400'
                : 'text-yellow-400'
            }
          >
            {revoked
              ? 'REVOKED'
              : proceduralReadiness.verified
              ? 'VERIFIED'
              : 'NOT VERIFIED'}
          </span>
        </div>

        {proceduralReadiness.verifiedAt && !revoked && (
          <div className="text-xs text-white/50">
            Verified at {new Date(proceduralReadiness.verifiedAt).toUTCString()}
          </div>
        )}

        {verification.revokedAt && (
          <div className="text-xs text-red-300">
            Revoked at {new Date(verification.revokedAt).toUTCString()}
          </div>
        )}
      </section>

      <section className="border border-white/10 rounded-lg p-4 space-y-2">
        <div className="text-xs font-medium">Verification Hash</div>
        <code className="block text-xs break-all text-white/70">
          {verification.hash}
        </code>

        <div className="text-xs text-white/50">
          Issued {new Date(verification.issuedAt).toUTCString()}
        </div>
      </section>

      <footer className="text-xs text-white/40 leading-relaxed">
        {disclaimer}
      </footer>
    </main>
  );
}