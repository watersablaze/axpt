'use client'

import { useEffect } from 'react'

import AxisGravity from '@/components/system/AxisGravity'
import AxisSpine from '@/components/system/AxisSpine'

import useSurfaceLayer from '@/hooks/useSurfaceLayer'
import useAxisVelocity from '@/hooks/useAxisVelocity'

export default function AxisRuntime() {

  // Detect which surface the user is currently viewing
  useSurfaceLayer()

  // Track scroll velocity for packet behavior
  useAxisVelocity()

  // Debug overlay toggle via URL
  useEffect(() => {

    if (window.location.search.includes('debug-axis')) {
      document.body.classList.add('debug-axis')
    }

  }, [])

return (
  <div className="axisField">

    <AxisGravity />
    <AxisSpine />

    <div className="axisCurrent" />
    <div className="axisMagnetism" />
    <div className="axisWake" />

  </div>
)
}