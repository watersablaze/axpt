'use client'

import { useLayer } from '@/lib/context/LayerContext'

export default function AxisGravity() {

  const { activeLayer } = useLayer()

  return (
    <div
      className="axisGravityField"
      data-layer={activeLayer}
      aria-hidden="true"
    />
  )
}