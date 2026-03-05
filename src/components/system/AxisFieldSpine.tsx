'use client'

import styles from './AxisFieldSpine.module.css'

export default function AxisFieldSpine() {
  return (
    <div className={styles.axisSpine} aria-hidden="true">
      <span className={styles.node} />
      <span className={styles.node} />
      <span className={styles.node} />
      <span className={styles.node} />
      <span className={styles.node} />
      <span className={styles.node} />
    </div>
  )
}