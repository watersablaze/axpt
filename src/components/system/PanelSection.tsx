import type { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  collapsible?: boolean
  tone?: 'default' | 'warning'
}

function sectionTone(tone: Props['tone']) {
  if (tone === 'warning') {
    return 'border-yellow-800 bg-yellow-950/10'
  }

  return 'border-neutral-800 bg-neutral-950/30'
}

export default function PanelSection({
  title,
  children,
  collapsible = false,
  tone = 'default',
}: Props) {
  const panelTone = sectionTone(tone)

  if (collapsible) {
    return (
      <details className={`rounded-xl border ${panelTone}`} open>
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-neutral-200">
          {title}
        </summary>
        <div className="border-t border-neutral-800 px-4 py-4">{children}</div>
      </details>
    )
  }

  return (
    <section className={`rounded-xl border ${panelTone}`}>
      <div className="border-b border-neutral-800 px-4 py-3">
        <h2 className="text-sm font-medium text-neutral-200">{title}</h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  )
}
