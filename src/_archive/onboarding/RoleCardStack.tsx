'use client';

import { useState } from 'react';
import styles from './RoleCardStack.module.css';

type Role = {
  title: string;
  summary: string;
};

const roles: Role[] = [
  { title: 'Investor', summary: 'Access vetted, Earth-aligned investment opportunities.' },
  { title: 'Project Manager', summary: 'Oversee initiatives and sync with capital flows.' },
  { title: 'Creative Producer', summary: 'Craft vision-aligned digital and real-world media.' },
  { title: 'Custodial Steward', summary: 'Maintain balance and integrity of token ecosystems.' },
];

export default function RoleCardStack() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className={styles.stack}>
      {roles.map((role, index) => (
        <div
          key={role.title}
          className={`${styles.card} ${active === index ? styles.active : ''}`}
          onClick={() => setActive(active === index ? null : index)}
        >
          <div className={styles.title}>{role.title}</div>
          {active === index && <div className={styles.summary}>{role.summary}</div>}
        </div>
      ))}
    </div>
  );
}