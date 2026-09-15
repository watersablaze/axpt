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

const LAYER_ORDER: LayerName[] = [
  'ENTRY',
  'FOUNDATION',
  'FRAMEWORK',
  'INTERFACES',
  'ETHOS',
  'FRENCH_WARD',
  'PRESENCE',
]

const ESTABLISHMENT_ATTRIBUTES: Partial<
  Record<LayerName, string>
> = {
  FOUNDATION: 'data-established-foundation',
  FRAMEWORK: 'data-established-framework',
  INTERFACES: 'data-established-interfaces',
  ETHOS: 'data-established-ethos',
  FRENCH_WARD: 'data-established-french-ward',
  PRESENCE: 'data-established-presence',
}

export function LayerProvider({
  children,
}: {
  children: ReactNode
}) {
  const [activeLayer, setActiveLayer] =
    useState<LayerName>('ENTRY')

  const [establishedIndex, setEstablishedIndex] =
    useState(0)

  useEffect(() => {
    const activeIndex =
      LAYER_ORDER.indexOf(activeLayer)

    document.body.setAttribute(
      'data-layer',
      activeLayer
    )

    if (activeIndex < 0) return

    setEstablishedIndex((current) =>
      Math.max(current, activeIndex)
    )
  }, [activeLayer])

  useEffect(() => {
    LAYER_ORDER.forEach((layer, index) => {
      const attribute =
        ESTABLISHMENT_ATTRIBUTES[layer]

      if (!attribute) return

      if (index <= establishedIndex) {
        document.body.setAttribute(
          attribute,
          'true'
        )
      } else {
        document.body.removeAttribute(
          attribute
        )
      }
    })
  }, [establishedIndex])

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
