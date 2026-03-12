'use client'

import styles from './InterfacesSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'
import CouncilGate from '@/components/council/CouncilGate'

import { useState } from 'react'

interface Props {
  onCouncilOpen?: () => void
}

export default function InterfacesSurface({ onCouncilOpen }: Props) {

  const [councilGateOpen, setCouncilGateOpen] = useState(false)

  return (

    <div className={styles.interfacesSurface}>

      <CouncilGate
        open={councilGateOpen}
        onClose={() => setCouncilGateOpen(false)}
      />

      <div className="surfaceFrame">

        <SurfaceHeader kicker="INTERFACES" />

        <h2 className={styles.headline}>
          Access is authority.
        </h2>

        <p className={styles.subline}>
          Governance command and institutional integration.
          Two pathways into the AXPT system.
        </p>

        <div className={styles.interfaceGrid}>

          <article className={styles.interfaceCard}>

          <h3>COUNCIL</h3>

            <p>
              Mandate review, policy enforcement, and governance execution.
              Decisions issued here become system record.
            </p>

            <button
              className={styles.inlineTrigger}
              onClick={() => {
                onCouncilOpen?.()
                setCouncilGateOpen(true)
              }}
            >
              Enter Council
            </button>

          </article>

          <article className={`${styles.interfaceCard} ${styles.interfaceDormant}`}>

            <h3>INSTITUTION</h3>

            <p>
              Partnership alignment, treasury coordination,
              and broadcast participation across the AXPT network.
            </p>

            <span className={styles.inlineDisabled}>
              Integration pathways coming online
            </span>

          </article>

        </div>

      </div>

    </div>

  )
}