import styles from './FWPassageGlyph.module.css'

export default function FWPassageGlyph() {
  return (
    <div
      className={styles.glyph}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 72 420"
        role="presentation"
      >
        <line
          x1="36"
          y1="18"
          x2="36"
          y2="402"
          className={styles.axis}
        />

        <circle
          cx="36"
          cy="72"
          r="5"
          className={styles.node}
        />

        <circle
          cx="36"
          cy="168"
          r="14"
          className={styles.threshold}
        />

        <line
          x1="12"
          y1="168"
          x2="60"
          y2="168"
          className={styles.crossing}
        />

        <circle
          cx="36"
          cy="260"
          r="5"
          className={styles.node}
        />

        <path
          d="M36 260 C 10 290, 62 315, 36 350"
          className={styles.route}
        />

        <circle
          cx="36"
          cy="350"
          r="5"
          className={styles.node}
        />
      </svg>

      <div className={styles.legend}>
        <span>Source</span>
        <span>Authority</span>
        <span>Passage</span>
        <span>Settlement</span>
      </div>
    </div>
  )
}
