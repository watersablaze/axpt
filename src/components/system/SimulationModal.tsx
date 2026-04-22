export default function SimulationModal({ data, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
      <div className="bg-neutral-900 p-6 rounded-xl w-[600px] space-y-4">
        <h2 className="text-lg font-semibold">
          Simulation: {data.intent}
        </h2>

        {/* Actions */}
        <div>
          <div className="text-sm text-neutral-400">Actions</div>
          {data.actions.map((a: any, i: number) => (
            <div key={i}>
              {a.willExecute ? '✓' : '–'} {a.type}
            </div>
          ))}
        </div>

        {/* Effects */}
        <div>
          <div className="text-sm text-neutral-400">Effects</div>
          {data.effects.map((e: any, i: number) => (
            <div key={i}>{e.description}</div>
          ))}
        </div>

        {/* Risks */}
        <div>
          <div className="text-sm text-neutral-400">Risks</div>
          {data.risks.map((r: any, i: number) => (
            <div
              key={i}
              className={
                r.level === 'HIGH'
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }
            >
              {r.level}: {r.message}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded border border-neutral-700 px-4 py-2 text-neutral-300 hover:bg-neutral-800"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded bg-green-600 px-4 py-2"
          >
            Execute Intent
          </button>
        </div>
      </div>
    </div>
  )
}
