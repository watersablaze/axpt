'use client'

import styles from './FoundationSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'

export default function FoundationSurface() {
  return (
    <div className={styles.foundationSurface}>
      <div className="surfaceFrame">
        <SurfaceHeader kicker="FOUNDATION LAYER" />

        <h2 className={styles.headline}>
          Continuity across culture, governance, and economic record.
        </h2>

        <p className={styles.subline}>
          AXPT establishes a custodial framework for institutional governance,
          accountable accounting, and structured transmission.
        </p>

        <div className={styles.pillars}>
          <span>Mandate</span>
          <span>Authority</span>
          <span>Continuity</span>
        </div>
      </div>
    </div>
  )
}