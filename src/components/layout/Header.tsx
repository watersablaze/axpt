'use client'

import { useEffect, useState } from 'react'

import styles from './Header.module.css'

import { useLayer } from '@/lib/context/LayerContext'


const DOCUMENT_STATES = [
  {
    key: 'ENTRY',
    index: '01',
    label: 'THRESHOLD',
    href: '#threshold',
  },
  {
    key: 'FOUNDATION',
    index: '02',
    label: 'FOUNDATION',
    href: '#foundation',
  },
  {
    key: 'FRAMEWORK',
    index: '03',
    label: 'FRAMEWORK',
    href: '#framework',
  },
  {
    key: 'INTERFACES',
    index: '04',
    label: 'INTERFACES',
    href: '#interfaces',
  },
  {
    key: 'ETHOS',
    index: '05',
    label: 'CIRCULATION',
    href: '#circulation',
  },
  {
    key: 'FRENCH_WARD',
    index: '06',
    label: 'FRENCH-WARD',
    href: '#french-ward',
  },
  {
    key: 'PRESENCE',
    index: '07',
    label: 'SEAL',
    href: '#seal',
  },
] as const


export default function Header() {
  const { activeLayer } = useLayer()

  const [registering, setRegistering] = useState(false)
  const [indexOpen, setIndexOpen] = useState(false)

  const current =
    DOCUMENT_STATES.find(
      (state) => state.key === activeLayer
    ) ??
    DOCUMENT_STATES[0]


  /*
   * Current-condition registration.
   *
   * activeLayer remains the sole authority.
   */

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


  /*
   * Once native scrolling establishes a new
   * active condition, close the document index.
   */

  useEffect(() => {
    setIndexOpen(false)
  }, [activeLayer])


  /*
   * Escape closes the index without creating
   * another navigation or runtime authority.
   */

  useEffect(() => {
    if (!indexOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setIndexOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [indexOpen])


  return (
    <header
      className={styles.header}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 80,
        pointerEvents: 'none',
      }}
    >
      <div
        className={styles.register}
        style={{
          position: 'relative',
          width:
            'min(calc(100% - (var(--rail-inset, 42px) * 2)), 1480px)',
          margin: '0 auto',
        }}
      >

        <a
          href="#threshold"
          className={styles.identity}
          aria-label="AXPT — return to Threshold"
          style={{
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <span className={styles.brand}>
            AXPT
          </span>

          <span className={styles.identityName}>
            AXIS POINT
          </span>
        </a>


        <div
          className={`${styles.headerSigil} ${
            indexOpen ? styles.headerSigilActive : ''
          }`}
          aria-hidden="true"
        >
          <img
            src="/sigil/v4/axis_sigil_full.png"
            alt=""
            draggable={false}
          />
        </div>


        <div className={styles.indexControl}>
          <button
            type="button"
            className={`${styles.condition} ${
              registering ? styles.registering : ''
            }`}
            aria-label={`Current document state: ${current.label}. Open document index.`}
            aria-expanded={indexOpen}
            aria-controls="axpt-document-index"
            onClick={() => {
              setIndexOpen((open) => !open)
            }}
          >
            <span className={styles.conditionIndex}>
              {current.index}
            </span>

            <span
              className={styles.conditionDivider}
              aria-hidden="true"
            >
              /
            </span>

            <span className={styles.conditionName}>
              {current.label}
            </span>

            <span
              className={styles.conditionDisclosure}
              aria-hidden="true"
            >
              {indexOpen ? '−' : '+'}
            </span>
          </button>


          {indexOpen && (
            <nav
              id="axpt-document-index"
              className={styles.indexPanel}
              aria-label="AXPT document index"
            >
              <p className={styles.indexHeading}>
                Document Index
              </p>

              <div className={styles.indexEntries}>
                {DOCUMENT_STATES.map((state) => {
                  const active =
                    state.key === activeLayer

                  return (
                    <a
                      key={state.key}
                      href={state.href}
                      className={styles.indexEntry}
                      aria-current={
                        active ? 'location' : undefined
                      }
                      onClick={() => {
                        setIndexOpen(false)
                      }}
                    >
                      <span
                        className={styles.indexEntryNumber}
                      >
                        {state.index}
                      </span>

                      <span
                        className={styles.indexEntryName}
                      >
                        {state.label}
                      </span>

                      <span
                        className={styles.indexEntryState}
                        aria-hidden="true"
                      >
                        {active ? '—' : ''}
                      </span>
                    </a>
                  )
                })}
              </div>

              <div className={styles.indexCoordinates}>
                <div className={styles.indexCoordinateRow}>
                  <span>AXPT.IO</span>
                  <span>V1</span>
                </div>

                <a
                  href="mailto:connect@axpt.io"
                  className={styles.indexContact}
                >
                  connect@axpt.io
                </a>
              </div>
            </nav>
          )}
        </div>

      </div>
    </header>
  )
}
