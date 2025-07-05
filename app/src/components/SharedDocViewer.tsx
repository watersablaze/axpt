'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface SharedDocViewerProps {
  token: string;
  docs: string[];
}

const readableLabel = (filename: string) => {
  if (filename.includes('Whitepaper')) return 'AXPT Whitepaper';
  if (filename.includes('Hemp')) return 'Hemp Ecosystem Brief';
  if (filename.includes('Supermarket')) return 'Supermarket Proposal';
  return filename.replace(/[-_]/g, ' ').replace('.pdf', '');
};

export default function SharedDocViewer({ token, docs }: SharedDocViewerProps) {
  // ✅ Persist token to localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('axpt_last_token', token);
    }
  }, [token]);

  return (
    <div style={{ backgroundColor: '#0a0a0a', padding: '2rem', color: '#fff' }}>
      {/* 🪶 Top Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <span style={{ fontWeight: 'bold', color: '#d8b4fe' }}>
          📁 Authorized Documents
        </span>
        <Link href="/account/dashboard" style={{ color: '#c084fc' }}>
          ← Dashboard
        </Link>
      </div>

      {/* 📚 Document Cards */}
      <div
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {docs.map((doc, i) => (
          <div
            key={i}
            style={{
              background: '#1a1a1a',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h4 style={{ color: '#f3f3f3' }}>{readableLabel(doc)}</h4>
            <p style={{ fontSize: '0.85rem', color: '#ccc' }}>📄 {doc}</p>
            <div style={{ marginTop: '0.75rem' }}>
              <a
                href={`/vault/${doc.replace('.pdf', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#93c5fd', textDecoration: 'none' }}
              >
                🔍 View
              </a>{' '}
              |{' '}
              <a
                href={`/docs/AXPT/${doc}`}
                download
                style={{ color: '#fcd34d', textDecoration: 'none' }}
              >
                ⬇️ Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}