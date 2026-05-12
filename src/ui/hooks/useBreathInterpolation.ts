'use client'

import { useEffect, useRef, useState } from 'react'

export function useBreathInterpolation<T>(
  value: T,
  lerp = 0.08
) {
  const [smooth, setSmooth] = useState(value)
  const ref = useRef(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  useEffect(() => {
    let frame: number

    const loop = () => {
      const current: any = smooth
      const target: any = ref.current

      if (!target) return

      const next: any = {}

      for (const key in target) {
        const a = current?.[key] ?? 0
        const b = target[key]

        if (typeof b === 'number') {
          next[key] = a + (b - a) * lerp
        } else {
          next[key] = b
        }
      }

      setSmooth(next)
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(frame)
  }, [lerp])

  return smooth
}