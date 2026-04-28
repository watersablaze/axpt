'use client'

import { useEffect } from 'react'
import { SURFACES } from '@/lib/surfaces/registry'
import { useLayer } from '@/lib/context/LayerContext'

function getNormalizedDepth(offset: number, maxOffset: number) {
  if (maxOffset <= 0) return 0

  return Math.min(1, Math.abs(offset) / maxOffset)
}

export default function SurfaceEngine() {

  const { activeLayer } = useLayer()

  useEffect(() => {

    const activeIndex = SURFACES.findIndex(
      s => s.layer === activeLayer
    )

    if (activeIndex < 0) return

    const maxOffset = Math.max(
      activeIndex,
      SURFACES.length - 1 - activeIndex,
      1
    )

    SURFACES.forEach((surface, index) => {

      const offset = index - activeIndex
      const depth = getNormalizedDepth(offset, maxOffset)

      const el = document.getElementById(surface.id)

      if (!el) return

      el.style.setProperty('--axis-depth', String(depth))
      el.dataset.axisState =
        offset === 0 ? 'active' : offset < 0 ? 'before' : 'after'
      el.dataset.axisOffset = String(offset)

    })

  }, [activeLayer])

  return null

}
