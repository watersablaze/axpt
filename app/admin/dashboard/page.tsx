// ✅ app/admin/dashboard/page.tsx
'use client';

import React from 'react';
import AdminStatCard from '@/components/admin/AdminStatCard';
import styles from '@/styles/AdminDashboard.module.css';
import TokenVerifier from '@/components/admin/TokenVerifier'

export default function AdminDashboard() {
  return (
    <div className={styles.container}>
      <h1>📊 Admin Dashboard</h1>
      <div className={styles.cardGrid}>
        <AdminStatCard title="Tokens Issued" value={0} />
        <AdminStatCard title="Tokens Verified" value={0} />
        <AdminStatCard title="Access Logs" value={0} />
      </div>
    </div>
  );
}