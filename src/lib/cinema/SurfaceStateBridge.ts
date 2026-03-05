"use client"

import { useEffect, useState } from "react"
import { surfaceTimeline } from "@/lib/surfaceEngine/SurfaceTimeline"

export default function SurfaceStateBridge() {

  const [surface, setSurface] = useState(surfaceTimeline.getActive())

  useEffect(() => {

    const unsubscribe = surfaceTimeline.subscribe(setSurface)

    return unsubscribe

  }, [])

  useEffect(() => {

    document.body.dataset.surface = surface

  }, [surface])

}