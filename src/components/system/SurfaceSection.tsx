import type { ReactNode } from 'react'
import type { SurfaceDefinition } from '@/lib/surfaces/registry'

type Props = {
  surface: SurfaceDefinition
  className?: string
  children: ReactNode
}

export default function SurfaceSection({
  surface,
  className = '',
  children
}: Props) {

  return (
    <section
      id={surface.id}
      className={`surface ${className}`}
      data-layer={surface.layer}
      aria-label={surface.ariaLabel ?? surface.title}
    >
      {children}
    </section>
  )
}