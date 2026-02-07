import { Case } from '@prisma/client';

export function CaseHeader({ c }: { c: Case }) {
  return (
    <section className="mb-8 border-b border-white/10 pb-4">
      <h1 className="text-2xl font-semibold">{c.title}</h1>

      <div className="mt-2 text-sm text-white/70 space-y-1">
        <div><strong>Case ID:</strong> {c.id}</div>
        <div><strong>Jurisdiction:</strong> {c.jurisdiction ?? '—'}</div>
        <div><strong>Mode:</strong> {c.mode}</div>
        <div>
          <strong>Status:</strong>{' '}
          <span className="inline-block rounded px-2 py-0.5 bg-white/10">
            {c.status}
          </span>
        </div>
      </div>
    </section>
  );
}