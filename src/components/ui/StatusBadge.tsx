'use client';

export default function StatusBadge({ status }: { status: string }) {
  const s = String(status).toUpperCase();

  const style =
    s === 'SUBMITTED'   ? 'bg-blue-500/15 text-blue-300 border-blue-500/40' :
    s === 'UNDER_REVIEW'? 'bg-amber-500/15 text-amber-300 border-amber-500/40' :
    s === 'APPROVED'    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' :
    s === 'DENIED'      ? 'bg-red-500/15 text-red-300 border-red-500/40' :
    s === 'FUNDED'      ? 'bg-purple-500/15 text-purple-300 border-purple-500/40' :
                          'bg-zinc-500/15 text-zinc-300 border-zinc-500/40';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] tracking-wide ${style}`}>
      {s}
    </span>
  );
}