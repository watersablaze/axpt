import Link from 'next/link'

import styles from './FWArchive.module.css'
import { FIELD_NOTES } from './fieldNotes'

export default function FWArchive() {
  return (
    <section
      className={styles.archive}
      id="archive"
      aria-labelledby="field-notes-archive-title"
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Record</p>

            <h2
              className={styles.title}
              id="field-notes-archive-title"
            >
              Field Notes Archive
            </h2>
          </div>

          <p className={styles.orientation}>
            Issued observations retained as part of the French-Ward
            institutional record.
          </p>
        </header>

        <div className={styles.entries}>
          {FIELD_NOTES.map((entry) => (
            <Link
              key={entry.number}
              className={styles.entry}
              href={entry.href}
            >
              <div className={styles.record}>
                <span className={styles.number}>
                  {entry.number}
                </span>

                <span className={styles.date}>
                  {entry.date}
                </span>
              </div>

              <div className={styles.subject}>
                <h3>{entry.title}</h3>

                <p>{entry.domains}</p>
              </div>

              <span
                className={styles.arrow}
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
