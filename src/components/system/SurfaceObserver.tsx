'use client'

import { useEffect, useRef } from 'react'

import { useLayer } from '@/lib/context/LayerContext'
import { SURFACES } from '@/lib/surfaces/registry'

import type { LayerName } from '@/shared/types/layers'


type ResolvedSurface = {
  element: HTMLElement
  layer: LayerName
}


export default function SurfaceObserver() {
  const { setActiveLayer } = useLayer()

  const currentLayer =
    useRef<LayerName | null>(null)

  const frame =
    useRef<number | null>(null)


  useEffect(() => {
    const getSurfaces = (): ResolvedSurface[] =>
      SURFACES.flatMap((surface) => {
        const element =
          document.getElementById(surface.id)

        if (!element) return []

        return [{
          element,
          layer: surface.layer,
        }]
      })


    const resolveActiveLayer = () => {
      frame.current = null

      const surfaces = getSurfaces()

      if (surfaces.length === 0) return


      const visualViewport =
        window.visualViewport

      const viewportCenter =
        visualViewport
          ? visualViewport.offsetTop +
            visualViewport.height / 2
          : window.innerHeight / 2

      let activeSurface:
        ResolvedSurface | null = null


      /*
       * Primary resolution:
       * whichever canonical surface contains
       * the vertical center of the viewport.
       */

      for (const surface of surfaces) {
        const rect =
          surface.element.getBoundingClientRect()

        if (
          rect.top <= viewportCenter &&
          rect.bottom >= viewportCenter
        ) {
          activeSurface = surface
          break
        }
      }


      /*
       * Defensive fallback:
       * if the center falls inside a gap,
       * resolve to the nearest canonical surface.
       */

      if (!activeSurface) {
        let nearestDistance = Infinity

        for (const surface of surfaces) {
          const rect =
            surface.element.getBoundingClientRect()

          const distance = Math.min(
            Math.abs(
              rect.top - viewportCenter
            ),
            Math.abs(
              rect.bottom - viewportCenter
            )
          )

          if (distance < nearestDistance) {
            nearestDistance = distance
            activeSurface = surface
          }
        }
      }


      if (!activeSurface) return

      const layer =
        activeSurface.layer

      if (
        layer === currentLayer.current
      ) {
        return
      }

      currentLayer.current = layer
      setActiveLayer(layer)
    }


    const scheduleResolve = () => {
      if (frame.current !== null) return

      frame.current =
        window.requestAnimationFrame(
          resolveActiveLayer
        )
    }


    /*
     * Resolve once immediately, then again
     * after browser layout has settled.
     */

    resolveActiveLayer()

    frame.current =
      window.requestAnimationFrame(
        resolveActiveLayer
      )


    window.addEventListener(
      'scroll',
      scheduleResolve,
      { passive: true }
    )

    window.addEventListener(
      'resize',
      scheduleResolve
    )

    window.addEventListener(
      'pageshow',
      scheduleResolve
    )

    window.addEventListener(
      'load',
      scheduleResolve
    )

    const visualViewport =
      window.visualViewport

    visualViewport?.addEventListener(
      'resize',
      scheduleResolve
    )

    visualViewport?.addEventListener(
      'scroll',
      scheduleResolve
    )


    return () => {
      window.removeEventListener(
        'scroll',
        scheduleResolve
      )

      window.removeEventListener(
        'resize',
        scheduleResolve
      )

      window.removeEventListener(
        'pageshow',
        scheduleResolve
      )

      window.removeEventListener(
        'load',
        scheduleResolve
      )

      visualViewport?.removeEventListener(
        'resize',
        scheduleResolve
      )

      visualViewport?.removeEventListener(
        'scroll',
        scheduleResolve
      )

      if (frame.current !== null) {
        window.cancelAnimationFrame(
          frame.current
        )
      }
    }
  }, [setActiveLayer])


  return null
}
