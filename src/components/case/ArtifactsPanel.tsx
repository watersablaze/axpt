import { Artifact } from '@prisma/client';

export function ArtifactsPanel({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-medium mb-4">Artifacts</h2>

      <ul className="space-y-2">
        {artifacts.length === 0 && (
          <li className="text-sm text-white/40 italic">
            No artifacts issued
          </li>
        )}

        {artifacts.map(a => (
          <li
            key={a.id}
            className="flex justify-between text-sm border-b border-white/5 pb-1"
          >
            <div>
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-white/50">
                {a.type} · {a.createdAt ? a.createdAt.toISOString() : 'pending'}
              </div>
            </div>

            <div className="text-xs text-white/50">
              {a.hash ? a.hash.slice(0, 10) + '…' : '—'}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
