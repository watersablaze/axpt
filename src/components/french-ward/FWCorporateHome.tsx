import Link from "next/link";

import type { FrenchWardInstitutionalProfileProjection } from "@/domains/institutions/french-ward/contracts";

import styles from "./FWCorporateHome.module.css";

type Props = { profile: FrenchWardInstitutionalProfileProjection };

/**
 * French-Ward corporate homepage. Institutional statements derive from the
 * canonical Profile; this page is not a second Profile publication.
 */
export default function FWCorporateHome({ profile }: Props) {
  return (
    <main className={styles.site} id="french-ward">
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/french-ward" className={styles.wordmark} aria-label="French-Ward home">
            French-Ward
            <span>Inc.</span>
          </Link>
          <nav className={styles.navigation} aria-label="Corporate navigation">
            <a href="#firm">The firm</a>
            <a href="#operations">Operations</a>
            <Link href="/french-ward/profile">Institutional Profile</Link>
            <Link href="/french-ward/transaction-intake">Commercial intake</Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="fw-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>French-Ward, Inc. <span aria-hidden="true">/</span> Institutional commerce</p>
            <h1 id="fw-title">International Trade <span>&amp;</span> Commercial Operations</h1>
            <p className={styles.heroStatement}>{profile.publicDescription}</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryLink} href="/french-ward/profile">
                View Institutional Profile <span aria-hidden="true">↗</span>
              </Link>
              <Link className={styles.secondaryLink} href="/french-ward/transaction-intake">
                Commercial intake <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <aside className={styles.heroAside} aria-label="Institutional positioning">
            <span className={styles.asideNumber}>FW / 01</span>
            <p>{profile.custodianshipThesis}</p>
            <span className={styles.asideDetail}>Governed responsibilities. Documented authority. Accountable execution.</span>
          </aside>
        </div>
      </section>

      <section className={styles.firm} id="firm" aria-labelledby="firm-heading">
        <div className={styles.sectionShell}>
          <div className={styles.sectionLabel}><span>01</span> The firm</div>
          <div className={styles.firmBody}>
            <h2 id="firm-heading">Commercial responsibility is the basis of the work.</h2>
            <div className={styles.firmProse}>
              <p className={styles.lead}>{profile.orientation}</p>
              <p>{profile.institutionalDefinition[0]}</p>
              <p>{profile.institutionalDefinition[1]}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.operations} id="operations" aria-labelledby="operations-heading">
        <div className={styles.sectionShell}>
          <div className={styles.sectionLabel}><span>02</span> Commercial practice</div>
          <div className={styles.operationHeading}>
            <h2 id="operations-heading">From commercial engagement to accountable performance.</h2>
            <p>Source relationships, agreed terms, documentation, delivery, and settlement are coordinated as distinct responsibilities within a governed process.</p>
          </div>
          <div className={styles.capabilities}>
            {profile.practiceAreas.map((item, i) => (
              <div className={styles.capability} key={item}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <div className={styles.operationsFoot}>
            <span>Institutional sequence</span>
            <p>{profile.operatingContinuum.join("  /  ")}</p>
          </div>
        </div>
      </section>

      <section className={styles.resources} aria-labelledby="resources-heading">
        <div className={styles.sectionShell}>
          <div className={styles.sectionLabel}><span>03</span> Institutional engagement</div>
          <h2 id="resources-heading">Work through established channels.</h2>
          <div className={styles.resourceGrid}>
            <Link href="/french-ward/profile" className={styles.resourceLink}>
              <span>01 / Institutional record</span>
              <strong>Official Institutional Profile</strong>
              <p>Read the current French-Ward publication, including its institutional responsibilities and documented relationship boundaries.</p>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </Link>
            <Link href="/french-ward/transaction-intake" className={styles.resourceLink}>
              <span>02 / Commercial entry</span>
              <strong>Letter of Intent &amp; Transaction Intake</strong>
              <p>Begin an authorized commercial intake through the established review and qualification process.</p>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </Link>
            <a href="mailto:connect@axpt.io" className={styles.resourceLink}>
              <span>03 / Correspondence</span>
              <strong>Institutional Inquiry</strong>
              <p>Contact French-Ward regarding institutional relationships and commercial coordination.</p>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </a>
          </div>
          <p className={styles.disclaimer}>The publication and correspondence channels do not establish an appointment, transaction authority, or authorization to represent French-Ward. Applicable authority is established by separate governing instruments.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><strong>French-Ward, Inc.</strong><span>International Trade &amp; Commercial Operations</span></div>
        <nav aria-label="Footer navigation">
          <Link href="/">AXPT</Link>
          <Link href="/french-ward/profile">Institutional Profile</Link>
          <Link href="/french-ward/transaction-intake">Commercial intake</Link>
        </nav>
      </footer>
    </main>
  );
}
