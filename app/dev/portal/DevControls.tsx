'use client';

type Props = { currentEmail?: string | null };

const A = 'resident.a@example.com';
const B = 'resident.b@example.com';

export default function DevControls({ currentEmail }: Props) {
  const isA = currentEmail === A;
  const isB = currentEmail === B;

  const btnBase =
    'px-3 py-1.5 rounded-lg border text-sm transition-colors';
  const btnIdle =
    'border-zinc-700 hover:border-purple-500/60';
  const btnActive =
    'border-purple-500/70 bg-purple-500/10 cursor-default';
  const btnDanger =
    'border-red-800 hover:border-red-500/60';

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-white/5 backdrop-blur-sm p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="text-sm font-medium text-zinc-200">Dev Controls</div>
          <div className="text-xs text-zinc-400">
            {currentEmail ? (
              <>Impersonating: <span className="text-purple-300">{currentEmail}</span></>
            ) : (
              'Not impersonating'
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Impersonate strip */}
          <a
            href={`/api/dev/impersonate?email=${encodeURIComponent(A)}`}
            onClick={isA ? (e) => e.preventDefault() : undefined}
            aria-disabled={isA}
            tabIndex={isA ? -1 : 0}
            className={[btnBase, isA ? btnActive : btnIdle].join(' ')}
          >
            Impersonate A
          </a>

          <a
            href={`/api/dev/impersonate?email=${encodeURIComponent(B)}`}
            onClick={isB ? (e) => e.preventDefault() : undefined}
            aria-disabled={isB}
            tabIndex={isB ? -1 : 0}
            className={[btnBase, isB ? btnActive : btnIdle].join(' ')}
          >
            Impersonate B
          </a>

          {/* Clear dev session */}
          <a
            href="/api/dev/impersonate?clear=1"
            className={[btnBase, btnIdle].join(' ')}
            title="Clear dev/session cookies and return to /dev/portal"
          >
            Clear dev session
          </a>

          {/* Seed helpers */}
          <a
            href="/api/dev/reseed-residents"
            className={[btnBase, btnIdle].join(' ')}
            title="Creates/upserts A+B; tops both to 1000 AXG if needed"
          >
            Seed A/B
          </a>

          <a
            href="/api/dev/reseed-residents?force=1"
            className={[btnBase, btnDanger].join(' ')}
            title="Danger: wipes any existing A/B & re-seeds from scratch"
          >
            Force reset A/B
          </a>

          {/* Reload */}
          <button
            onClick={() => window.location.reload()}
            className={[btnBase, btnIdle].join(' ')}
            title="Hard refresh after actions"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}