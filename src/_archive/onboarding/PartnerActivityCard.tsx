'use client';

import styles from './PartnerActivityCard.module.css';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  displayName?: string;
  lastLogin?: string;
  loginCount?: number;
  viewedDocs?: string[];
}

export default function PartnerActivityCard({
  displayName,
  lastLogin,
  loginCount = 0,
  viewedDocs = [],
}: Props) {
  return (
    <div className={styles.cardWrapper}>
      <h2 className={styles.heading}>
        Alignment Journey {displayName ? `for ${displayName}` : ''}
      </h2>
      <div className={styles.metricsGrid}>
        <div className={styles.metricBox}>
          <h3>Last Login</h3>
          <p>
            {lastLogin
              ? `${formatDistanceToNow(new Date(lastLogin))} ago`
              : 'Not yet recorded'}
          </p>
        </div>
        <div className={styles.metricBox}>
          <h3>Total Visits</h3>
          <p>{loginCount}</p>
        </div>
        <div className={styles.metricBox}>
          <h3>Documents Viewed</h3>
          <ul className={styles.docList}>
            {viewedDocs.length > 0 ? (
              viewedDocs.map((doc, i) => (
                <li key={i} className={styles.docItem}>
                  {doc.replace('.pdf', '')}
                </li>
              ))
            ) : (
              <li>None yet</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}