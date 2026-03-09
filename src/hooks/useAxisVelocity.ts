'use client'

import { useEffect } from "react"

export default function useAxisVelocity() {

  useEffect(() => {

    let lastY = window.scrollY
    let lastTime = performance.now()

    const update = () => {

      const now = performance.now()
      const currentY = window.scrollY

      const dy = Math.abs(currentY - lastY)
      const dt = now - lastTime

      const velocity = dy / dt

      // normalize
      const v = Math.min(1, velocity * 6)

      document.documentElement.style.setProperty(
        "--axis-speed",
        `${1 - v * 0.6}`
      )

      lastY = currentY
      lastTime = now

    }

    window.addEventListener("scroll", update, { passive: true })

    let idleTimer: any

const handleIdle = () => {

  clearTimeout(idleTimer)

  idleTimer = setTimeout(() => {

    if (document.body.dataset.surface === "PRESENCE") {

      document.body.classList.add("axis-lock")

      setTimeout(() => {
        document.body.classList.remove("axis-lock")
      }, 900)

    }

  }, 350)

}

window.addEventListener("scroll", handleIdle)

    return () => window.removeEventListener("scroll", update)

  }, [])

}