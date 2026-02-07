import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CaseProgressionBar from '@/src/components/case/CaseProgressionBar';

export default async function CaseDashboard({
  params,
}: {
  params: { caseId: string };
}) {
  const c = await prisma.case.findUnique({
    where: { id: params.caseId },
    include: {
      gates: {
        orderBy: { ord: 'asc' },
        include: { items: true },
      },
      artifacts: {
        orderBy: { createdAt: 'desc' },
      },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!c) notFound();

  const gate4 = c.gates.find((g) => g.ord === 4);

  return (
    <section style={{ padding: '2rem', maxWidth: 900 }}>
      {/* ── Header ───────────────────────── */}
      <h1>{c.title}</h1>

      <p style={{ marginBottom: '1rem' }}>
        <strong>Status:</strong> {c.status}
        <br />
        <strong>Mode:</strong> {c.mode}
        <br />
        <strong>Jurisdiction:</strong> {c.jurisdiction ?? '—'}
        <br />
        <strong>Case ID:</strong> {c.id}
      </p>

      {/* ── Progression Bar ─────────────── */}
      <CaseProgressionBar
        caseData={{
          status: c.status,
          gates: c.gates.map((g) => ({
            id: g.id,
            ord: g.ord,
            name: g.name,
            status: g.status,
          })),
        }}
      />

      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        {c.status === 'DRAFT' && (
          <Link
            href={`/admin/cases/${c.id}/activate`}
            className="rounded-xl border border-zinc-800 bg-black/30 hover:bg-white/10 transition px-3 py-2 text-sm"
          >
            Activate Case
          </Link>
        )}
      </div>

      <hr />

      {/* ── Gate Progression ─────────────── */}
      <h2>Gate Progression</h2>

      <ol style={{ paddingLeft: '1.5rem' }}>
        {c.gates.map((g) => {
          const canVerify =
            c.status === 'ACTIVE' && g.status !== 'VERIFIED';

          return (
            <li
              key={g.id}
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: 6,
              }}
            >
              <strong>
                Gate {g.ord}: {g.name}
              </strong>

              <div>Status: {g.status}</div>
              <div>Items: {g.items.length}</div>

              {canVerify && (
                <div style={{ marginTop: '0.75rem' }}>
                  <a
                    href={`/admin/cases/${c.id}/gates/${g.id}/verify`}
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 0.9rem',
                      background: '#000',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      borderRadius: 4,
                    }}
                  >
                    Verify Gate
                  </a>
                </div>
              )}

              {g.status === 'VERIFIED' && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.85rem',
                    color: 'green',
                    fontWeight: 600,
                  }}
                >
                  ✓ Gate verified
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <hr />

      {/* ── Escrow Initiation ────────────── */}
      <h2>Escrow Handoff</h2>

      {c.status === 'ESCROW_INITIATED' && (
        <p style={{ color: 'green', fontWeight: 600 }}>
          ✓ Escrow has already been initiated.
        </p>
      )}

      {c.status === 'ACTIVE' && gate4?.status === 'VERIFIED' && (
        <a
          href={`/admin/cases/${c.id}/escrow`}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.2rem',
            background: '#111',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600,
            borderRadius: 6,
          }}
        >
          Initiate Escrow Handoff
        </a>
      )}

      {c.status === 'ACTIVE' && gate4?.status !== 'VERIFIED' && (
        <p style={{ color: '#777' }}>
          Escrow cannot be initiated until Gate 4 is verified.
        </p>
      )}

      <hr />

      {/* ── Artifacts ───────────────────── */}
      <h2>Artifacts</h2>

      {c.artifacts.length === 0 && (
        <p style={{ color: '#777' }}>No artifacts issued yet.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {c.artifacts.map((a) => (
          <li
            key={a.id}
            style={{
              marginBottom: '0.75rem',
              padding: '0.75rem 1rem',
              border: '1px solid #ddd',
              borderRadius: 6,
            }}
          >
            <div style={{ fontWeight: 600 }}>{a.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>
              {a.type} • {new Date(a.createdAt).toLocaleString()}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <a
                href={`/admin/artifacts/${a.id}`}
                style={{ fontSize: '0.85rem', textDecoration: 'underline' }}
              >
                View artifact →
              </a>
            </div>
          </li>
        ))}
      </ul>

      <hr />

      {/* ── Event Log ───────────────────── */}
      <h2>Recent Events</h2>

      <ul>
        {c.events.map((e) => (
          <li key={e.id}>
            [{new Date(e.createdAt).toLocaleString()}] {e.action}
          </li>
        ))}
      </ul>
    </section>
  );
}