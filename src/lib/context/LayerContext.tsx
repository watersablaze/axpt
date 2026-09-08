'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type { ReactNode } from 'react'
import type { LayerName } from '@/shared/types/layers'

type LayerContextType = {
  activeLayer: LayerName
  setActiveLayer: (layer: LayerName) => void
}

const LayerContext =
  createContext<LayerContextType | null>(null)

export function LayerProvider({
  children,
}: {
  children: ReactNode
}) {
  const [activeLayer, setActiveLayer] =
    useState<LayerName>('ENTRY')

  useEffect(() => {
    document.body.setAttribute(
      'data-layer',
      activeLayer
    )
  }, [activeLayer])

  const value = useMemo(
    () => ({
      activeLayer,
      setActiveLayer,
    }),
    [activeLayer]
  )

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  )
}

export function useLayer() {
  const context = useContext(LayerContext)

  if (!context) {
    throw new Error(
      'useLayer must be used inside LayerProvider'
    )
  }

  return context
}
