import { EventLog } from '@prisma/client';

export function EventLogPanel({ events }: { events: EventLog[] }) {
  return (
    <section>
      <h2 className="text-lg font-medium mb-4">Event Log</h2>

      <ul className="space-y-2 text-sm">
        {events.length === 0 && (
          <li className="text-white/40 italic">
            No events recorded
          </li>
        )}

        {events.map(e => (
          <li
            key={e.id}
            className="border-b border-white/5 pb-2"
          >
            <div className="flex justify-between">
              <span>
                <strong>{e.action}</strong> — {e.actor}
              </span>
              <span className="text-xs text-white/50">
                {e.createdAt ? e.createdAt.toISOString() : 'pending'}
              </span>
            </div>

            {e.detail && (
              <pre className="mt-1 text-xs text-white/50 whitespace-pre-wrap">
                {JSON.stringify(e.detail, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
