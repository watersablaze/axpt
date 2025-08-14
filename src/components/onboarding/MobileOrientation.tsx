'use client';

import styles from './MobileOrientation.module.css';

export default function MobileOrientation() {
  return (
    <div className={styles.orientationContainer}>
      <p className={styles.title}>Review the Contributor Roles</p>
      <p className={styles.description}>
        You will select one during your upgrade process. Choose what resonates with your mission.
      </p>
    </div>
  );
}