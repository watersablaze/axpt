"use client"

import useSurfaceTimeline from "./useSurfaceTimeline"

export function SurfaceProvider({ children }: { children: React.ReactNode }) {

  useSurfaceTimeline()

  return <>{children}</>

}