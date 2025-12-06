import StreamHistory from './StreamHistory';
import ChatHeatmap from './ChatHeatmap';
import WatchTimeGraph from './WatchTimeGraph';

export default function AdvancedAnalyticsPage() {
  const mockSessions = [
    {
      id: '1',
      startedAt: new Date().toISOString(),
      endedAt: null,
      peakViewers: 22,
      averageViewers: 16,
      durationSeconds: 3600,
    },
  ];

  const mockHeatmap = Array(48).fill(0).map(() => Math.floor(Math.random() * 10));
  const mockWatch = Array(30).fill(0).map(() => Math.floor(Math.random() * 100));

  return (
    <div>
      <h1>Advanced Analytics</h1>

      <StreamHistory sessions={mockSessions} />
      <ChatHeatmap data={mockHeatmap} />
      <WatchTimeGraph points={mockWatch} />
    </div>
  );
}