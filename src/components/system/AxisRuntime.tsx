'use client'

import { useEffect } from 'react'

export default function AxisRuntime() {

  useEffect(() => {

    if (window.location.search.includes('debug-axis')) {
      document.body.classList.add('debug-axis')
    }

    return () => {
      document.body.classList.remove('debug-axis')
    }

  }, [])

  return (

    <div className="axisField">

      <div className="axisCurrent" />

    </div>

  )

}