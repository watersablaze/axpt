import type { ReactNode } from "react";
import styles from "./InstrumentShell.module.css";
import { InstrumentMovementNav } from "./InstrumentMovementNav";
import { InstrumentStatusRail } from "./InstrumentStatusRail";

type Movement = {
  index: string;
  label: string;
  active?: boolean;
};

type InstrumentShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  reference: string;
  version: string;
  status: string;
  movements: Movement[];
  children: ReactNode;
};

export function InstrumentShell({
  eyebrow,
  title,
  subtitle,
  reference,
  version,
  status,
  movements,
  children,
}: InstrumentShellProps) {
  return (
    <main className={styles.shell}>
      <div className={styles.field} aria-hidden="true" />

      <header className={styles.hero}>
        <div className={styles.utility}>
          <span>{eyebrow}</span>
          <span>Private Institutional Instrument</span>
        </div>

        <div className={styles.identity}>
          <p className={styles.brand}>FRENCH-WARD</p>

          <div className={styles.titleGroup}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <dl className={styles.meta}>
            <div>
              <dt>Reference</dt>
              <dd>{reference}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{version}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{status}</dd>
            </div>
          </dl>
        </div>

        <InstrumentStatusRail />
        <InstrumentMovementNav movements={movements} />
      </header>

      <div className={styles.content}>{children}</div>
    </main>
  );
}
