"use client";

import styles from "./GlobalMotherIntermission.module.css";

type GlobalMotherIntermissionProps = Readonly<{
  recipientName?: string | null;
}>;

export function GlobalMotherIntermission({
  recipientName,
}: GlobalMotherIntermissionProps) {
  return (
    <main className={styles.page}>
      <div className={styles.rainLeft} aria-hidden="true" />
      <div className={styles.rainRight} aria-hidden="true" />

      <section className={styles.card} aria-labelledby="gm-intermission-title">
        <p className={styles.eyebrow}>
          French-Ward / Private Deliberative Chamber
        </p>

        <div className={styles.seal} aria-hidden="true">
          ◈
        </div>

        <p className={styles.cycle}>
          CHAMBER V1 · INTERMISSION
        </p>

        <h1 id="gm-intermission-title">
          Framework Chamber
        </h1>

        <p className={styles.lead}>
          The first deliberative cycle has concluded.
        </p>

        {recipientName ? (
          <p className={styles.recipient}>
            Prepared access for {recipientName}
          </p>
        ) : null}

        <div className={styles.divider} />

        <div className={styles.notices}>
          <article className={styles.notice}>
            <span className={styles.icon} aria-hidden="true">
              ⏳
            </span>
            <div>
              <h2>Deliberative Pause</h2>
              <p>
                French-Ward is incorporating additional clarity,
                participant guidance, and field direction into the
                next Chamber release.
              </p>
            </div>
          </article>

          <article className={styles.notice}>
            <span className={styles.icon} aria-hidden="true">
              ◈
            </span>
            <div>
              <h2>Institutional Record Preserved</h2>
              <p>
                The prior Framework, responses, and deliberative
                record remain preserved as part of the Chamber history.
              </p>
            </div>
          </article>

          <article className={styles.notice}>
            <span className={styles.icon} aria-hidden="true">
              ↻
            </span>
            <div>
              <h2>Next Chamber in Preparation</h2>
              <p>
                A matured version of the Framework is now being
                prepared. New private access will be issued when the
                next deliberative cycle opens.
              </p>
            </div>
          </article>
        </div>

        <p className={styles.closed}>
          No further response is required within this Chamber version.
        </p>

        <footer className={styles.footer}>
          <span>GM-KENYA-RCF-001</span>
          <span>French-Ward Administration</span>
        </footer>
      </section>
    </main>
  );
}
