'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import AdminStatCard from '@/components/admin/AdminStatCard';
import AccessLogRow from '@/components/admin/AccessLogRow';
import TokenIssueForm from '@/components/admin/TokenIssueForm';

interface Token {
  partner: string;
  tier: string;
  docs: string[];
  issuedAt: string;
  exp?: number;
  origin?: string;
  qrPath?: string;
  method?: string;
}

interface AccessLog {
  token: string;
  tier: string;
  partner: string;
  path: string;
  timestamp: string;
}

export default function AdminPage() {
  const { data: tokens, mutate: refreshTokens } = useSWR<Token[]>('/api/admin/tokens', fetcher);
  const { data: logs } = useSWR<AccessLog[]>('/api/admin/logs', fetcher);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleTokenIssued = () => {
    refreshTokens();
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
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
        {tokens?.map((token, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              cursor: 'pointer',
            }}
            onClick={() => toggleExpand(idx)}
          >
            <strong>{token.partner}</strong> ({token.tier}) - {token.docs.length} doc(s)

            {expandedIndex === idx && (
              <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                <p><strong>Issued At:</strong> {new Date(token.issuedAt).toLocaleString()}</p>
                {token.exp && <p><strong>Expires:</strong> {new Date(token.exp * 1000).toLocaleString()}</p>}
                {token.origin && <p><strong>Origin:</strong> {token.origin}</p>}
                {token.method && <p><strong>Method:</strong> {token.method}</p>}
                {token.qrPath && (
                  <p><strong>QR Code:</strong> <a href={token.qrPath} target="_blank" rel="noreferrer">View</a></p>
                )}
                <p><strong>Docs:</strong> {token.docs.join(', ')}</p>
              </div>
            )}
          </div>
        ))}
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