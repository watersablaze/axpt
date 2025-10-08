// app/admin/cada-waitlist/page.tsx
import { prisma } from '@/prisma';

export default async function CadaWaitlistAdminPage() {
  const entries = await prisma.cadaWaitlist.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">CADA Waitlist</h1>

      <div className="space-y-4">
        {entries.length === 0 && <p>No entries yet.</p>}
        {entries.map((entry) => (
          <div key={entry.id} className="p-4 border border-gray-700 rounded bg-gray-900">
            <p><strong>Email:</strong> {entry.email}</p>
            <p><em>{new Date(entry.createdAt).toLocaleString()}</em></p>
          </div>
        ))}
      </div>
    </main>
  );
}