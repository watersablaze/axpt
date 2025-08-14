'use client';

type Props = {
  currentEmail: string | null;
};

const A = 'resident.a@example.com';
const B = 'resident.b@example.com';

export default function DevImpersonateStrip({ currentEmail }: Props) {
  const who =
    currentEmail === A ? 'Resident A' :
    currentEmail === B ? 'Resident B' :
    'None';

  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-purple-400" />
        <span className="text-zinc-400">
          Status:&nbsp;
          <span className="text-zinc-200 font-medium">
            Impersonating: {who}
          </span>
          {currentEmail && (
            <span className="text-zinc-500"> ({currentEmail})</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`/api/dev/impersonate?email=${encodeURIComponent(A)}`}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-purple-500/60"
        >
          Impersonate A
        </a>
        <a
          href={`/api/dev/impersonate?email=${encodeURIComponent(B)}`}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-purple-500/60"
        >
          Impersonate B
        </a>
        <a
          href="/api/dev/impersonate?clear=1"
          className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-red-500/60"
          title="Clear dev & app session cookies"
        >
          Clear
        </a>
      </div>
    </div>
  );
}