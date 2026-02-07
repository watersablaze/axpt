import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function EscrowInitiationPage({
  params,
}: {
  params: { caseId: string };
}) {
  const c = await prisma.case.findUnique({
    where: { id: params.caseId },
    include: {
      gates: { orderBy: { ord: 'asc' } },
      artifacts: {
        where: { type: 'ESCROW_HANDOFF_PACKET' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!c) notFound();

  const gate4 = c.gates.find((g) => g.ord === 4);
  const escrowArtifact = c.artifacts[0] ?? null;

  const canInitiate =
    c.status === 'ACTIVE' && gate4?.status === 'VERIFIED';

  return (
    <section style={{ padding: '2rem', maxWidth: 720 }}>
      <h1>Escrow Handoff</h1>

      <p>
        <strong>Case:</strong> {c.title}
        <br />
        <strong>Status:</strong> {c.status}
      </p>

      <hr />

      {/* ── SEALED STATE ───────────────────── */}
      {c.status === 'ESCROW_INITIATED' && (
        <>
          <p style={{ color: 'green', fontWeight: 700 }}>
            ✓ Escrow has been successfully initiated.
          </p>

          {escrowArtifact && (
            <div style={{ marginTop: '1rem' }}>
              <p>
                <strong>Escrow Packet Hash:</strong>
              </p>
              <code
                style={{
                  display: 'block',
                  background: '#f4f4f4',
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                }}
              >
                {escrowArtifact.hash}
              </code>

              <a
                href={`/api/axpt/artifacts/${escrowArtifact.id}/download`}
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  padding: '0.6rem 1rem',
                  background: '#111',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Download Escrow Packet
              </a>
            </div>
          )}
        </>
      )}

      {/* ── BLOCKED STATE ─────────────────── */}
      {!canInitiate && c.status !== 'ESCROW_INITIATED' && (
        <div style={{ color: '#a00', fontWeight: 600 }}>
          Escrow cannot be initiated.
          <ul>
            {c.status !== 'ACTIVE' && <li>Case must be ACTIVE</li>}
            {gate4?.status !== 'VERIFIED' && <li>Gate 4 must be VERIFIED</li>}
          </ul>
        </div>
      )}

      {/* ── CRITICAL ACTION STATE ─────────── */}
      {canInitiate && (
        <>
          <p style={{ marginTop: '1.5rem', fontWeight: 700 }}>
            ⚠️ This action is irreversible.
          </p>

          <ul>
            <li>All case data will be sealed</li>
            <li>No further gate edits allowed</li>
            <li>Custody transfers to escrow</li>
            <li>An escrow packet will be generated</li>
          </ul>

          <form
            method="POST"
            action={`/api/axpt/cases/${c.id}/handoff/escrow`}
          >
            <button
              type="submit"
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1.25rem',
                background: '#000',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Confirm & Initiate Escrow
            </button>
          </form>
        </>
      )}
    </section>
  );
}