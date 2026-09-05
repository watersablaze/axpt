'use client'

import styles from './Header.module.css'
import DevLayerIndicator from '@/components/system/DevLayerIndicator'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerRail}>

        <div className={styles.brand}>
          <span className={styles.brandText}>AXPT</span>
        </div>

        <div className={styles.layerSlot}>
          <DevLayerIndicator />
        </div>

      </div>
    </header>
  )
}
