// app/admin/initiatives/new/page.tsx
import { requireElderServer } from '@/lib/auth/requireElderServer';
import Form from './Form';

export const STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as const;
export const CATEGORIES = ['ENERGY', 'FINTECH', 'DATA', 'SECURITY', 'OTHER'] as const;

export default async function NewInitiativePage() {
  await requireElderServer();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold">Create Initiative</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Define a new initiative (title, slug, category, status, and summary).
        </p>

        {/* Client island */}
        <Form statuses={[...STATUSES]} categories={[...CATEGORIES]} />
      </div>
    </main>
  );
}