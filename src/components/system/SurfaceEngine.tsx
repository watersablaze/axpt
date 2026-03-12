'use client'

import { useEffect } from 'react'
import { SURFACES } from '@/lib/surfaces/registry'
import { useLayer } from '@/lib/context/LayerContext'

export default function SurfaceEngine() {

  const { activeLayer } = useLayer()

  useEffect(() => {

    const root = document.documentElement

    const activeIndex = SURFACES.findIndex(
      s => s.layer === activeLayer
    )

    SURFACES.forEach((surface, index) => {

      const depth = index - activeIndex

      const el = document.getElementById(surface.id)

      if (!el) return

      el.style.setProperty('--axis-depth', String(Math.abs(depth)))

      if (depth === 0) {

        el.style.setProperty('--axis-depth', '0')

      }

    })

  }, [activeLayer])

  return null

}