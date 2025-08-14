'use client';
export default function ProjectsError({ error }: { error: Error }) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-400">{error.message || 'Unexpected error'}</p>
      </div>
    </main>
  );
}