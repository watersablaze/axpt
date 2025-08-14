// 📁 src/components/dashboard/ModuleCardGrid.tsx

'use client';

import { ReactNode } from 'react';
import styles from './ModuleCardGrid.module.css';

type ModuleCardGridProps = {
  children: ReactNode;
};

export default function ModuleCardGrid({ children }: ModuleCardGridProps) {
  return <div className={styles.grid}>{children}</div>;
}