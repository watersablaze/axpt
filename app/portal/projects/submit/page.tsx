// app/portal/projects/submit/page.tsx
import { requireResidentServer } from '@/lib/auth/requireResidentServer';
import SubmitProjectForm from './submit-form';

export default async function SubmitProjectPage() {
  await requireResidentServer(); // gate
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold">Submit a Project</h1>
        <p className="text-sm text-zinc-400 mt-1">Propose your initiative for Council review.</p>
        <div className="mt-6">
          <SubmitProjectForm />
        </div>
      </div>
    </main>
  );
}