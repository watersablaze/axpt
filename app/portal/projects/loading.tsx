export default function LoadingProjects() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="h-6 w-48 bg-white/5 rounded-md" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-zinc-800 bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}