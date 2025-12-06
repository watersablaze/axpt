export default function StreamHistory({ sessions }: { sessions: StreamSession[] }) {
  return (
    <div className="streamHistory">
      <h2>Stream History</h2>

      <ul className="sessionList">
        {sessions.map((s) => (
          <li key={s.id} className="sessionCard">
            <p>Started: {new Date(s.startedAt).toLocaleString()}</p>
            <p>Duration: {Math.floor(s.durationSeconds / 60)} minutes</p>
            <p>Peak: {s.peakViewers}</p>
            <p>Average: {s.averageViewers}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}