import { UIMode } from '@/lib/context/MirrorRayContext';

export default function PerformanceWarning({
  mode,
  performanceMode
}: {
  mode: UIMode;
  performanceMode: string;
}) {
  const bg = {
    low: 'var(--perf-low-bg)',
    medium: 'var(--perf-med-bg)',
    high: 'var(--perf-high-bg)',
  }[performanceMode];

  return (
    <div
      style={{
        background: bg,
        padding: '10px',
        borderRadius: '8px',
        marginTop: '10px',
        lineHeight: '1.35',
        fontSize: '0.78rem',
      }}
    >
      {mode === 'oracle' && (
        <>
          <strong>Nommo Performance Notice</strong><br />
          Device pacing shows instability.<br />
          Ceremonial timings recalibrated.<br />
          SYS: frame={performanceMode}; resonance="adaptive";
        </>
      )}

      {mode === 'elder' && (
        <>
          <strong>Performance Advisory</strong><br />
          Reduced stability detected.<br />
          Timings adjusted for governance clarity.
        </>
      )}

      {mode === 'nommo' && (
        <>
          <strong>Perf Warning:</strong><br />
          frame={performanceMode} — animations shortened.
        </>
      )}
    </div>
  );
}