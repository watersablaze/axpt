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

  if (!gate || gate.caseId !== params.caseId) {
    notFound();
  }

  if (gate.status === 'VERIFIED') {
    redirect(`/admin/cases/${params.caseId}`);
  }

  return (
    <section style={{ padding: '2rem', maxWidth: 720 }}>
      <h1>
        Verify Gate {gate.ord}: {gate.name}
      </h1>

      <p>
        <strong>Case:</strong> {gate.case.title}
        <br />
        <strong>Current Status:</strong> {gate.status}
      </p>

      <hr />

      <h2>Verification Items</h2>
      <ul>
        {gate.items.map((item) => (
          <li key={item.id}>
            {item.description} — <em>{item.status}</em>
          </li>
        ))}
      </ul>

      <hr />

      <form
        action={`/api/axpt/cases/${params.caseId}/gates/${params.gateId}/verify`}
        method="post"
      >
        <label>
          Verification Notes
          <textarea
            name="notes"
            rows={4}
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Describe how this gate was verified…"
            required
          />
        </label>

        <br />
        <br />

        <button
          type="submit"
          style={{
            background: 'black',
            color: 'white',
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
          }}
        >
          Confirm Gate Verification
        </button>
      </form>
    </section>
  );
}