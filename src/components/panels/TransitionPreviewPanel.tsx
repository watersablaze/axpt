'use client'

export type TransitionPreviewCheck = {
  id: string
  label: string
  passed: boolean
  detail?: string
}

export type TransitionPreviewGate = {
  passed: boolean
  blockingReason?: string
  checks: TransitionPreviewCheck[]
}

export type TransitionPreview = {
  dossierId: string
  reference: string
  fromState: string
  toState: string
  executable: boolean

  stateMachine: {
    passed: boolean
  }

  artifactGate: TransitionPreviewGate

  approvalGate: TransitionPreviewGate

   consequences: Array<{
   type: string
   label?: string
   detail: string
   severity?: 'INFO' | 'WARNING' | 'CRITICAL'
 }>
}

type Props = {
  preview: TransitionPreview
  executing?: boolean
  onExecute: () => Promise<void>
  onCancel: () => void
}

function gateTone(passed: boolean) {
  return passed
    ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
    : 'border-orange-900 bg-orange-950/20 text-orange-300'
}

export default function TransitionPreviewPanel({
  preview,
  executing = false,
  onExecute,
  onCancel,
}: Props) {
  return (
    <div className="rounded-lg border border-cyan-900 bg-cyan-950/10 p-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-cyan-400">
            Transition Preview
          </div>

          <div className="mt-1 text-sm font-medium text-white">
            {preview.fromState} → {preview.toState}
          </div>

          <div className="mt-1 text-[11px] text-neutral-500">
            {preview.reference}
          </div>
        </div>

        <div
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${
            preview.executable
              ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300'
              : 'border-orange-900 bg-orange-950/20 text-orange-300'
          }`}
        >
          {preview.executable ? 'Executable' : 'Blocked'}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div
          className={`rounded border p-2 ${gateTone(
            preview.artifactGate.passed
          )}`}
        >
          <div className="font-medium">
            Artifact Gate
          </div>

          <div className="mt-1 text-[11px]">
            {preview.artifactGate.checks.filter(
              (c) => c.passed
            ).length}
            /
            {preview.artifactGate.checks.length}
            {' '}checks passed
          </div>
        </div>

        <div
          className={`rounded border p-2 ${gateTone(
            preview.approvalGate.passed
          )}`}
        >
          <div className="font-medium">
            Approval Gate
          </div>

          <div className="mt-1 text-[11px]">
            {preview.approvalGate.checks.filter(
              (c) => c.passed
            ).length}
            /
            {preview.approvalGate.checks.length}
            {' '}checks passed
          </div>
        </div>

        <div className="rounded border border-neutral-800 bg-black/20 p-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">
            Consequences
          </div>

          <div className="mt-2 space-y-1">
            {preview.consequences.map((item) => (
              <div
                key={`${item.label ?? item.type}-${item.detail}`}
                className="rounded border border-neutral-800 bg-black/20 px-2 py-1"
              >
                <div className="text-[10px] uppercase tracking-wide text-cyan-300">
                  {item.label ?? item.type}
                </div>

                <div className="mt-1 text-neutral-400">
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2 border-t border-neutral-800 pt-3">
        <button
          type="button"
          disabled={
            !preview.executable || executing
          }
          onClick={onExecute}
          className="rounded border border-emerald-900 bg-emerald-950/20 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300 disabled:border-neutral-800 disabled:text-neutral-600"
        >
          {executing
            ? 'Executing...'
            : 'Execute Transition'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-neutral-700 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}