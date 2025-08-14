'use client';

import styles from './AlertModule.module.css';

interface AlertProps {
  latestLog: {
    status: 'healthy' | 'degraded' | 'offline' | string;
    message: string;
    createdAt: string;
  };
}

const getStatusStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case 'healthy':
      return styles.healthy;
    case 'degraded':
      return styles.degraded;
    case 'offline':
      return styles.offline;
    default:
      return styles.unknown;
  }
};

const formatAgo = (createdAt: string) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  return mins > 0 ? `${mins} min ago` : 'Just now';
};

export function AlertModule({ latestLog }: AlertProps) {
  const { status, message, createdAt } = latestLog;
  const statusStyle = getStatusStyle(status);

  return (
    <div className={`${styles.alertModule} ${statusStyle}`}>
      <h4 className={styles.title}>🛰️ Alert Module</h4>
      <div className={styles.statusText}>
        Status: <span>{status.toUpperCase()}</span>
      </div>
      <div className={styles.messageText}>{message}</div>
      <div className={styles.timeInfo}>🕰 Last Ping: {formatAgo(createdAt)}</div>
    </div>
  );
}