import styles from './GeologicalSubstrate.module.css'

export default function GeologicalSubstrate() {
  return (
    <div
      className={styles.substrate}
      aria-hidden="true"
    >
      <div className={styles.materialBody} />
      <div className={styles.strataField} />
      <div className={styles.pressureField} />

      <div className={styles.chromaticField} />
    </div>
  )
}
