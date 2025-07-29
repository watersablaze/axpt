'use client';

import { useState } from 'react';
import styles from './DocCardGrid.module.css';
import DocCard from './DocCard';
import clsx from 'clsx';

type DocCardGridProps = {
  heading?: string;
  folder: string;
  filenames: string[];
  token: string;
};

export default function DocCardGrid({
  heading = 'Document Vault',
  folder,
  filenames,
  token,
}: DocCardGridProps) {
  const [darkMode, setDarkMode] = useState(false);

  const handleToggle = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <div
      className={clsx(styles.gridWrapper, {
        [styles.darkMode]: darkMode,
      })}
    >
      <h2 className={styles.gridHeading}>
        {heading}
      </h2>

      <div className={styles.cardGrid}>
        {filenames.map((filename) => (
          <div key={filename} className={styles.cardWrapper}>
            <DocCard
              filename={filename}
              token={token}
              folder={folder}
              visible={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}