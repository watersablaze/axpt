"use client"

import React from "react"

type PanelWrapperProps = {
  title?: string
  children: React.ReactNode
  isEmpty?: boolean
  priority?: number
  critical?: boolean
}

export default function PanelWrapper({
  title,
  children,
  isEmpty,
  priority = 0,
  critical = false,
}: PanelWrapperProps) {

  const base = "rounded-lg p-4 border transition-all duration-300"

  const border =
    critical
      ? "border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.25)]"
      : "border-neutral-800"

  const scale = critical ? "scale-[1.02]" : ""
  const opacity = isEmpty ? "opacity-50" : ""

  return (
    <div className={`${base} ${border} ${scale} ${opacity}`}>

      {title && (
        <div className="text-xs uppercase text-neutral-500 mb-3 flex justify-between">
          <span>{title}</span>

          {priority > 0 && (
            <span className="text-[10px] text-neutral-600">
              P{priority}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  )
}