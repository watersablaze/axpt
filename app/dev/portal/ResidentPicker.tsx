'use client';

export default function ResidentPicker() {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-6">
      <h2 className="text-lg font-semibold">Resident Picket</h2>
      <p className="text-xs text-zinc-400 mt-1">Impersonate quickly for sandbox transfers.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="/api/dev/impersonate?email=resident.a@example.com"
          className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-sm"
        >
          Impersonate Resident A
        </a>
        <a
          href="/api/dev/impersonate?email=resident.b@example.com"
          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-sm"
        >
          Impersonate Resident B
        </a>
      </div>
      <p className="text-[11px] text-zinc-500 mt-2">
        If you see “Impersonation failed”, ensure A/B exist via <code>/api/dev/init-residents</code>.
      </p>
    </div>
  );
}