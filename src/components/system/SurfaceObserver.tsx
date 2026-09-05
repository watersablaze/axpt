'use client'

import { useEffect, useRef } from 'react'
import { useLayer } from '@/lib/context/LayerContext'
import type { LayerName } from '@/shared/types/layers'

export default function SurfaceObserver() {
  const { setActiveLayer } = useLayer()

  const currentLayer = useRef<LayerName | null>(null)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const resolveActiveLayer = () => {
      frame.current = null

      const viewportCenter = window.innerHeight / 2

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('.surface[data-layer]')
      )

      let activeSection: HTMLElement | null = null

      for (const section of sections) {
        const rect = section.getBoundingClientRect()

        if (
          rect.top <= viewportCenter &&
          rect.bottom >= viewportCenter
        ) {
          activeSection = section
          break
        }
      }

      /*
       * Defensive fallback:
       * if center falls into an unexpected gap,
       * choose the nearest surface boundary.
       */
      if (!activeSection) {
        let nearestDistance = Infinity

        for (const section of sections) {
          const rect = section.getBoundingClientRect()

          const distance = Math.min(
            Math.abs(rect.top - viewportCenter),
            Math.abs(rect.bottom - viewportCenter)
          )

          if (distance < nearestDistance) {
            nearestDistance = distance
            activeSection = section
          }
        }
      }

      const layer =
        activeSection?.dataset.layer as LayerName | undefined

      if (!layer || layer === currentLayer.current) return

      currentLayer.current = layer
      setActiveLayer(layer)
    }

    const scheduleResolve = () => {
      if (frame.current !== null) return

      frame.current =
        window.requestAnimationFrame(resolveActiveLayer)
    }

    resolveActiveLayer()

    window.addEventListener('scroll', scheduleResolve, {
      passive: true,
    })

    window.addEventListener('resize', scheduleResolve)

    return () => {
      window.removeEventListener('scroll', scheduleResolve)
      window.removeEventListener('resize', scheduleResolve)

      if (frame.current !== null) {
        window.cancelAnimationFrame(frame.current)
      }
    }
  }, [setActiveLayer])

  return null
}
