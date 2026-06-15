'use client'

export type ControlCenterMode =
  | 'COMMAND'
  | 'OPERATOR'
  | 'EXECUTION'

type Props = {
  mode: ControlCenterMode
  onChange: (mode: ControlCenterMode) => void
}

const modes: ControlCenterMode[] = [
  'COMMAND',
  'OPERATOR',
  'EXECUTION',
]

export default function ControlCenterModeSwitcher({
  mode,
  onChange,
}: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2">
      <div className="grid grid-cols-3 gap-1">
        {modes.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={
              item === mode
                ? 'rounded border border-cyan-900 bg-cyan-950/30 px-2 py-1.5 text-[10px] uppercase tracking-wide text-cyan-300'
                : 'rounded border border-neutral-800 bg-black/20 px-2 py-1.5 text-[10px] uppercase tracking-wide text-neutral-500 hover:text-neutral-300'
            }
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}