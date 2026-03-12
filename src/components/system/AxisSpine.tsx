'use client'

import styles from './AxisSpine.module.css'

export default function AxisSpine() {
  return (
    <div className={styles.axisLayer} aria-hidden="true">
      <div className={styles.axisLine} />
    </div>
  )
}