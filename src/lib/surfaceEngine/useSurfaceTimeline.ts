"use client"

import { useEffect } from "react"
import { surfaceTimeline } from "./SurfaceTimeline"

export default function useSurfaceTimeline() {

  useEffect(() => {

    const surfaces = document.querySelectorAll<HTMLElement>(".surface")

    const observer = new IntersectionObserver(
      (entries) => {

        entries.forEach(entry => {

          const layer = entry.target.dataset.layer

          if (!layer) return

          if (entry.isIntersecting) {
            surfaceTimeline.setActive(layer)
          }

        })

      },
      {
        threshold: 0.55
      }
    )

    surfaces.forEach(el => observer.observe(el))

    return () => observer.disconnect()

  }, [])

}