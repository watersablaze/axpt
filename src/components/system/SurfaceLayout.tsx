import type { ReactNode } from 'react'

export default function SurfaceLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle ? <p className="text-sm text-neutral-400">{subtitle}</p> : null}
        </div>

        {actions ? <div>{actions}</div> : null}
      </div>

      {children}
    </div>
  )
}
