import Link from "next/link";
import type { FrenchWardInstitutionalProfileProjection } from "@/domains/institutions/french-ward/contracts";
import styles from "./FWCorporateHome.module.css";

type Props = { profile: FrenchWardInstitutionalProfileProjection };

/** Corporate presence; all institutional statements derive from the canonical publication. */
export default function FWCorporateHome({ profile }: Props) {
  return (
    <main className={styles.site} id="french-ward">
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/french-ward" className={styles.wordmark} aria-label="French-Ward home">FRENCH-WARD<span>Inc.</span></Link>
          <nav className={styles.navigation} aria-label="Corporate navigation">
            <a href="#firm">About</a>
            <a href="#access">Access &amp; Engagement</a>
          </nav>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="fw-title">
        <div className={styles.landscapeField} aria-hidden="true">
          <span className={styles.distantHorizon}/>
          <span className={styles.thresholdTrace}/>
          <span className={styles.landscapeCoordinate}/>
        </div>
        <div className={styles.heroTopline}>
          <span>FW / INTERNATIONAL COMMERCE</span>
          <span>EST. IN FLORIDA · OPERATING INTERNATIONALLY</span>
        </div>
        <div className={styles.landscapeInner}>
          <div className={styles.landscapeIdentity}>
            <p className={styles.eyebrow}>FRENCH-WARD, INC. / CORPORATE RECORD</p>
            <h1 id="fw-title">FRENCH-WARD</h1>
            <p className={styles.landscapeClassification}>International Trade &amp; Commercial Operations</p>
            <div className={styles.landscapeRule} aria-hidden="true"/>
            <p className={styles.landscapeStatement}>{profile.publicDescription}</p>
          </div>
          <div className={styles.landscapeAxis} aria-hidden="true">
            <span>FW / 001</span>
            <span>AUTHORITY · COMMERCE · PASSAGE</span>
          </div>
        </div>
        <div className={styles.landscapeBottom}>
          <span className={styles.landscapeBottomLabel}>01 / ABOUT FRENCH-WARD</span>
          <nav className={styles.landscapeActions} aria-label="Primary institutional pathways">
            <Link href="/french-ward/profile">INSTITUTIONAL PROFILE <span aria-hidden="true">↗</span></Link>
            <Link href="/french-ward/transaction-intake">COMMERCIAL INTAKE <span aria-hidden="true">↗</span></Link>
          </nav>
          <a className={styles.landscapeExplore} href="#firm">EXPLORE FRENCH-WARD <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className={`${styles.firm} ${styles.institutionalContinuity}`} id="firm" aria-labelledby="firm-heading">
        <div className={styles.recordIndex}><span>01 / ABOUT FRENCH-WARD</span><span>OPERATING PRACTICE</span></div>
        <div className={styles.snapshotPosition}>
          <h2 id="firm-heading">RESPONSIBILITY BEFORE PASSAGE</h2>
          <p>{profile.orientation}</p>
        </div>
        <div className={styles.firmFoot} aria-label="Institutional thesis">
          <p>{profile.custodianshipThesis}</p>
        </div>
        <div className={styles.continuityPractice} id="operations" aria-label="Commercial practice">
          <div className={styles.continuityPracticeIndex}>
            <span>COMMERCIAL DISCIPLINE</span>
            <span>CAPABILITY / 02</span>
          </div>
          <p className={styles.practiceNarrative}>
            French-Ward&apos;s commercial practice encompasses{" "}
            <span>source and counterparty relationships</span>, the preparation
            and maintenance of <span>commercial documentation</span>, assessment
            of transaction readiness and outstanding requirements, coordination
            of delivery and cross-border arrangements, and preparation of
            settlement instructions in support of accountable performance.
          </p>
          <Link href="/french-ward/profile" className={styles.practiceProfileLink}>
            Full institutional operating record <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className={styles.resources} id="access" aria-labelledby="resources-heading">
        <div className={styles.accessHeading}>
          <div className={styles.accessIdentity}>
            <span className={styles.accessIndex}>03 / FW</span>
            <h2 id="resources-heading">ACCESS &amp; ENGAGEMENT</h2>
          </div>
          <p>Select the appropriate channel.</p>
        </div>
        <nav className={styles.accessSectors} aria-label="Institutional access channels">
          <Link href="/french-ward/profile" className={styles.accessSector}>
            <span className={styles.sectorTop}><span>01 / PUBLICATION</span><span className={styles.sectorArrow} aria-hidden="true">↗</span></span>
            <svg className={styles.sectorIcon} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M16 7.5c-4.5-2.7-8.4-2.7-12-1v18c3.6-1.7 7.5-1.7 12 1 4.5-2.7 8.4-2.7 12-1v-18c-3.6-1.7-7.5-1.7-12 1Z"/><path d="M16 7.5v18M7.5 11.3c2-.45 3.85-.2 5.5.65M19 11.95c1.65-.85 3.5-1.1 5.5-.65"/></svg>
            <strong>OFFICIAL INSTITUTIONAL PROFILE</strong>
            <span className={styles.sectorDescription}>Explore French-Ward’s institutional identity, commercial activities, operating principles, and approach to international trade.</span>
          </Link>
          <Link href="/french-ward/transaction-intake" className={styles.accessSector}>
            <span className={styles.sectorTop}><span>02 / COMMERCIAL ENTRY</span><span className={styles.sectorArrow} aria-hidden="true">↗</span></span>
            <svg className={styles.sectorIcon} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><path d="M7 3.5h13l5 5V28H7Z"/><path d="M20 3.5v5h5M11 14h10M11 18h10M11 22h5M19 23l2 2 4-4"/></svg>
            <strong>LETTER OF INTENT / TRANSACTION INTAKE</strong>
            <span className={styles.sectorDescription}>Present a proposed transaction or commercial opportunity for preliminary review by French-Ward.</span>
          </Link>
          <Link href="/french-ward/inquiry" className={styles.accessSector}>
            <span className={styles.sectorTop}><span>03 / CORRESPONDENCE</span><span className={styles.sectorArrow} aria-hidden="true">↗</span></span>
            <svg className={styles.sectorIcon} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true"><rect x="3.5" y="8" width="25" height="17"/><path d="m4 9 12 9 12-9M3.5 25l9-8M28.5 25l-9-8"/></svg>
            <strong>INSTITUTIONAL INQUIRY</strong>
            <span className={styles.sectorDescription}>Contact French-Ward about business relationships, institutional cooperation, or general inquiries.</span>
          </Link>
        </nav>
        <p className={styles.disclaimer}>The publication and correspondence channels do not establish an appointment, transaction authority, or authorization to represent French-Ward. Applicable authority is established by separate governing instruments.</p>
      </section>
      <footer className={styles.footer}>
        <div className={styles.footerIdentity}><strong>FRENCH-WARD</strong><small>INC. / INTERNATIONAL TRADE &amp; COMMERCIAL OPERATIONS</small></div>
        <div className={styles.footerUtility}><span>CORRESPONDENCE</span><a href="mailto:french-ward@axpt.io">french-ward@axpt.io <span aria-hidden="true">↗</span></a></div>
        <nav aria-label="Footer navigation"><Link href="/">AXPT</Link><Link href="/french-ward/profile">Profile</Link><Link href="/french-ward/transaction-intake">Intake</Link></nav>
      </footer>
    </main>
  );
}
