import styles from './FWDoctrine.module.css'

export default function FWDoctrine() {
  return (
    <section className={styles.doctrine} id="doctrine">
      <div className={styles.inner}>
        <div className={styles.meta}>
          <span>Doctrine 001</span>
          <span>French-Ward Doctrine Library</span>
        </div>

        <blockquote className={styles.statement}>
          Existence is a property of the asset.
          <br />
          Passage is a property of the system surrounding it.
        </blockquote>
      </div>
    </section>
  )
}
