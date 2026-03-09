'use client'

import styles from './AxisSpine.module.css'

export default function AxisSpine() {
  return (
    <div className={styles.axisLayer} aria-hidden="true">

      {/* atmospheric depth around axis */}
      <div className={styles.axisField} />

      {/* structural spine */}
      <div className={styles.axisLine} />

      {/* packet motion */}
      <div className={styles.axisPacketsUp} />

    </div>
  )
}