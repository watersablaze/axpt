'use client'

import { useEffect, useState } from 'react'
import styles from './Header.module.css'
import { useLayer } from '@/lib/context/LayerContext'

const DOCUMENT_STATES = {
  ENTRY:       { index: '01', label: 'THRESHOLD' },
  FOUNDATION:  { index: '02', label: 'FOUNDATION' },
  FRAMEWORK:   { index: '03', label: 'FRAMEWORK' },
  INTERFACES:  { index: '04', label: 'INTERFACES' },
  ETHOS:       { index: '05', label: 'CIRCULATION' },
  PRESENCE:    { index: '06', label: 'SEAL' },
} as const

export default function Header() {
  const { activeLayer } = useLayer()
  const [registering, setRegistering] = useState(false)

  const current =
    DOCUMENT_STATES[activeLayer as keyof typeof DOCUMENT_STATES] ??
    DOCUMENT_STATES.ENTRY

  useEffect(() => {
    setRegistering(false)

    const frame = requestAnimationFrame(() => {
      setRegistering(true)
    })

    const timeout = window.setTimeout(() => {
      setRegistering(false)
    }, 460)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [activeLayer])

  return (
    <header className={styles.header}>
      <div className={styles.register}>
        <div className={styles.identity}>
          <span className={styles.brand}>AXPT</span>
          <span className={styles.identityName}>AXIS POINT</span>
        </div>

        <div
          className={`${styles.condition} ${
            registering ? styles.registering : ''
          }`}
          aria-label={`Current document state: ${current.label}`}
        >
          <span className={styles.conditionIndex}>
            {current.index}
          </span>

          <span className={styles.conditionDivider} aria-hidden="true">
            /
          </span>

          <span className={styles.conditionName}>
            {current.label}
          </span>
        </div>
      </div>
    </header>
  )
}
