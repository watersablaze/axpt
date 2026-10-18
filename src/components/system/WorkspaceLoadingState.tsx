export default function WorkspaceLoadingState() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex min-h-[100dvh] items-center justify-center px-6 py-12 sm:px-10"
      style={{
        background:
          'radial-gradient(ellipse at 50% 35%, #1b3035 0%, #101b23 45%, #0b1219 100%)',
        color: '#eee6d7',
      }}
    >
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#c5a25f]/50 text-[#d7b77c]"
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 3 29 16 16 29 3 16 16 3Z" stroke="currentColor" />
              <path d="M16 9v14M9 16h14" stroke="currentColor" />
              <circle cx="16" cy="16" r="3" stroke="currentColor" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d7b77c]">
              AXPT
            </p>
            <p className="mt-1 text-xs tracking-wide text-[#aabcbf]">
              Your institutional workspace
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-[#c5a25f]/30 pt-8">
          <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            Opening your workspace
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#b7c9cc]">
            Bringing your current records into view.
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs tracking-wide text-[#d7b77c]">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" style={{ animationDelay: '180ms' }} />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" style={{ animationDelay: '360ms' }} />
            </span>
            Loading current records
          </div>
        </div>
      </div>
    </section>
  )
}
