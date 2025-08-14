// 📁 app/dashboard/shadow-vault/[id]/page.tsx

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: { id: string };
}

export default async function ShadowVaultEntryPage({ params }: Props) {
  const entry = await prisma.gemIntake.findUnique({
    where: { id: params.id },
  });

  if (!entry) return notFound();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#111] text-white rounded-lg shadow-lg border border-[#333]">
      <h1 className="text-2xl font-bold mb-2">{entry.desiredGem}</h1>
      <p className="text-sm text-gray-400 mb-4">
        Submitted: {new Date(entry.createdAt).toLocaleString()}
      </p>

      <div className="space-y-2 text-gray-200">
        <p><strong>👤 Name:</strong> {entry.name}</p>
        <p><strong>📧 Email:</strong> {entry.email}</p>
        {entry.phone && <p><strong>📱 Phone:</strong> {entry.phone}</p>}
        <p><strong>🧊 Format:</strong> {entry.format || '—'}</p>
        <p><strong>📐 Size:</strong> {entry.size || '—'}</p>
        <p><strong>🔢 Quantity:</strong> {entry.quantity || '—'}</p>
        {entry.notes && <p><strong>📝 Notes:</strong> <span className="italic text-gray-400">“{entry.notes}”</span></p>}
      </div>

      <div className="mt-6 flex justify-between">
        <Link href="/dashboard/shadow-vault" className="text-indigo-400 hover:underline">
          ← Back to entries
        </Link>

        <button className="text-red-400 border border-red-400 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition-all text-sm">
          Delete Entry
        </button>
      </div>
    </div>
  );
}