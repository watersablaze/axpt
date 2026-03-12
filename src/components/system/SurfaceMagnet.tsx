'use client'

import { useEffect } from 'react'

export default function SurfaceMagnet() {

  useEffect(() => {

    const surfaces = document.querySelectorAll('.surface')

    let ticking = false
    let lastSnap = ''

    function triggerAxisPulse() {

      document.body.classList.add('axis-resonance')

      setTimeout(() => {
        document.body.classList.remove('axis-resonance')
      }, 700)

    }

    function onScroll() {

      if (ticking) return

      ticking = true

      requestAnimationFrame(() => {

        surfaces.forEach((surface) => {

          const rect = surface.getBoundingClientRect()

          const mid = rect.top + rect.height / 2

          const viewportMid = window.innerHeight / 2

          const distance = Math.abs(mid - viewportMid)

          const id = surface.getAttribute('id')

          if (distance < 60 && id !== lastSnap) {

            lastSnap = id || ''

            surface.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            })

            triggerAxisPulse()

          }

        })

        ticking = false

      })

    }

    window.addEventListener('scroll', onScroll)

    return () => window.removeEventListener('scroll', onScroll)

  }, [])

  return null
}