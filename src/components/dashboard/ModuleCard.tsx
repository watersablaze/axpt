// 📁 app/components/dashboard/ModuleCard.tsx

'use client';
import Link from 'next/link';
import styles from './ModuleCard.module.css';

interface ModuleCardProps {
  id: string;
  name: string;
  email: string;
  phone?: string;
  desiredGem: string;
  format?: string;
  size?: string;
  quantity?: string;
  notes?: string;
  createdAt: string;
}

export function ModuleCard({
  id,
  name,
  email,
  phone,
  desiredGem,
  format,
  size,
  quantity,
  notes,
  createdAt,
}: ModuleCardProps) {
  return (
    <div className={styles.card}>
      <h3>{desiredGem}</h3>
      <h4>
        {name} • {email}
        {phone && <> • {phone}</>}
      </h4>
      <p>
        Format: {format || '—'} | Size: {size || '—'} | Qty: {quantity || '—'}
      </p>
      {notes && <p><em>{notes}</em></p>}
      <time>{new Date(createdAt).toLocaleString()}</time>

      <Link href={`/dashboard/shadow-vault/${id}`}>View Detail →</Link>
    </div>
  );
}