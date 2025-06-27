// ✅ FIXED: app/admin/page.tsx
'use client';

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import AdminStatCard from '@/components/admin/AdminStatCard';
import TokenRow from '@/components/admin/TokenRow';
import AccessLogRow from '@/components/admin/AccessLogRow';
import TokenIssueForm from '@/components/admin/TokenIssueForm';
import styles from '@/styles/AdminTokens.module.css';
import type { TokenPayload } from '@/types/token';

export default function AdminPage() {
  const { data: tokens, mutate: refreshTokens } = useSWR<TokenPayload[]>('/api/admin/tokens', fetcher);
  const { data: logs } = useSWR<any[]>('/api/admin/logs', fetcher);

  const handleTokenIssued = () => {
    refreshTokens();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>AXPT Admin Dashboard</h1>

      <section style={{ margin: '2rem 0' }}>
        <h2>Quick Stats</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <AdminStatCard title="Total Tokens" value={tokens ? tokens.length : 0} />
          <AdminStatCard title="Access Logs" value={logs ? logs.length : 0} />
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Issue New Token</h2>
        <TokenIssueForm onIssue={handleTokenIssued} />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Active Tokens</h2>
        <div>
          {tokens?.map((token, idx) => (
            <TokenRow key={idx} token={token} />
          ))}
        </div>
      </section>

      <section>
        <h2>Access Log</h2>
        <div>
          {logs?.map((log, idx) => (
            <AccessLogRow
              key={idx}
              doc={log.path}
              partner={log.partner}
              dateTime={new Date(log.timestamp).toLocaleString()}
            />
          ))}
        </div>
      </section>
    </div>
  );
}