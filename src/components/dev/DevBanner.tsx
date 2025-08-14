// src/components/dev/DevBanner.tsx
export default function DevBanner({ note }: { note?: string }) {
  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-200 px-4 py-2 text-xs backdrop-blur">
          <strong className="uppercase tracking-wide">Dev Preview</strong>
          <span className="opacity-80"> — {note || 'Authentication is bypassed here.'}</span>
        </div>
      </div>
    </div>
  );
}