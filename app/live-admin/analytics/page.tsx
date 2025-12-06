import ViewersGraph from '@/components/live/analytics/ViewersGraph';
import PeakViewersGraph from '@/components/live/analytics/PeakViewersGraph';
import { fetchOwncastHealth, fetchViewerTimeSeries } from '@/lib/live/owncastClient';

export default async function AnalyticsPage() {
  const [health, series] = await Promise.all([
    fetchOwncastHealth(),
    fetchViewerTimeSeries(),
  ]);

  return (
    <div className="analyticsPage">
      <h1 className="pageTitle">Live Analytics</h1>

      <section className="analysisSection">
        <h2>Stream Status</h2>
        <p>
          {health.online
            ? `Online (v${health.version ?? 'unknown'})`
            : `Offline${health.error ? ` – ${health.error}` : ''}`}
        </p>
      </section>

      <section className="analysisSection">
        <ViewersGraph data={series} />
      </section>

      <section className="analysisSection">
        <PeakViewersGraph data={series} />
      </section>
    </div>
  );
}