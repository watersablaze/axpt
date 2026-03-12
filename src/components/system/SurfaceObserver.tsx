'use client'

import { useEffect, useRef } from 'react'
import { useLayer } from '@/lib/context/LayerContext'
import type { LayerName } from '@/types/layers'

export default function SurfaceObserver() {

  const { setActiveLayer } = useLayer()
  const currentLayer = useRef<LayerName | null>(null)

  useEffect(() => {

    const sections = document.querySelectorAll<HTMLElement>('[data-layer]')

    const observer = new IntersectionObserver(

      (entries) => {

        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visible) return

        const layer =
          visible.target.getAttribute('data-layer') as LayerName | null

        if (!layer) return

        if (currentLayer.current === layer) return

        currentLayer.current = layer
        setActiveLayer(layer)

      },

      {
        threshold: [0.55,0.65,0.75],
        rootMargin: '-12% 0px -12% 0px'
      }

    )

    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
    

  }, [setActiveLayer])
  

  return null
}