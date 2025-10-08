// 📁 app/src/components/NeonWake.tsx
'use client'

import { useEffect } from 'react'

export default function NeonWake() {
  useEffect(() => {
    fetch('/api/db/ping')
      .then(() => console.log('[Neon Wake] PING OK'))
      .catch(err => console.error('[Neon Wake] PING FAILED', err))
  }, [])

  return null
}