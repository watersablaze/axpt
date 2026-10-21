import type { ReactNode } from "react";
import styles from "./AdminSurfaceHeader.module.css";

type Props = {
  id?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
};

export default function AdminSurfaceHeader({
  id, title, description, actions, toolbar,
}: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <h1 id={id} className={styles.title}>{title}</h1>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className={styles.actions}>{actions}</div>
      ) : null}
      {toolbar ? (
        <details className={styles.toolbarDisclosure} open>
          <summary className={styles.toolbarToggle}>
            <span>Categories &amp; refresh</span>
            <span className={styles.toggleGlyph} aria-hidden="true">⌄</span>
          </summary>
          <div className={styles.toolbar}>{toolbar}</div>
        </details>
      ) : null}
    </header>
  );
}
