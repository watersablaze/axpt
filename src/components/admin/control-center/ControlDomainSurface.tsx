import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./ControlDomainSurface.module.css";

type Props = { title: string; description: string; rail?: ReactNode; hideHeading?: boolean; children: ReactNode };
export default function ControlDomainSurface({ title, description, rail, hideHeading = false, children }: Props) {
  const navigation = rail ?? (
    <nav aria-label="Related workspaces">
      <Link href="/admin/control-center">Command workspace ↗</Link>
      <Link href="/admin/control-center/treasury">Treasury ↗</Link>
      <Link href="/admin/control-center/instruments">Instruments ↗</Link>
    </nav>
  );
  return (
    <section className={styles.surface} aria-label={title}>
      {!hideHeading && <header className={styles.heading}>
        <div><h1>{title}</h1><p>{description}</p></div>
        <Link href="/admin">Admin overview ↗</Link>
      </header>}
      <div className={styles.body}>
        <aside className={`${styles.rail} ${styles.desktopRail}`} aria-label={`${title} navigation`}>
          {navigation}
        </aside>
        <details className={styles.mobileRail}>
          <summary>
            <span>Browse records &amp; sections</span>
            <span className={styles.railMark} aria-hidden="true">+</span>
          </summary>
          <div className={styles.mobileRailBody}>{navigation}</div>
        </details>
        <div className={styles.stage} tabIndex={0} role="region" aria-label={`${title} content`}>
          {children}
        </div>
      </div>
    </section>
  );
}
