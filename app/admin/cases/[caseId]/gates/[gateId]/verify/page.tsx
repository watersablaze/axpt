// app/admin/cases/[caseId]/gates/[gateId]/verify/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';

export default async function VerifyGatePage({
  params,
}: {
  params: { caseId: string; gateId: string };
}) {
  const gate = await prisma.gate.findUnique({
    where: { id: params.gateId },
    include: {
      case: true,
      items: true,
    },
  });

  if (!gate || gate.caseId !== params.caseId) notFound();

  if (gate.status === 'VERIFIED') {
    redirect(`/admin/cases/${params.caseId}`);
  }

  return (
    <section style={{ padding: '2rem', maxWidth: 720 }}>
      <h1>Verify Gate</h1>

      <p>
        <strong>Case:</strong> {gate.case.title}
        <br />
        <strong>Gate:</strong> {gate.ord} — {gate.name}
        <br />
        <strong>Status:</strong> {gate.status}
      </p>

      <hr />

      <p style={{ marginTop: '1.25rem' }}>
        You are about to mark this gate as <strong>VERIFIED</strong>.
      </p>

      <ul>
        <li>This confirms all attached verification items are complete</li>
        <li>This action is logged and irreversible</li>
        <li>This may unlock subsequent gates or escrow</li>
      </ul>

      <form
        method="POST"
        action={`/api/axpt/gates/${gate.id}/verify`}
        style={{ marginTop: '1.5rem' }}
      >
        <button
          type="submit"
          style={{
            padding: '0.7rem 1.2rem',
            background: '#000',
            color: '#fff',
            fontWeight: 700,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Confirm Gate Verification
        </button>

        <a
          href={`/admin/cases/${params.caseId}`}
          style={{
            marginLeft: '1rem',
            fontSize: '0.9rem',
            textDecoration: 'underline',
          }}
        >
          Cancel
        </a>
      </form>
    </section>
  );
}