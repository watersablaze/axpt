import React from 'react';

export interface AccessLogRowProps {
  doc: string;
  partner: string;
  dateTime: string;
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  borderBottom: '1px solid #eee',
  backgroundColor: '#fff',
  borderRadius: '8px',
  marginBottom: '0.5rem',
  fontSize: '0.95rem',
};

export default function AccessLogRow({ doc, partner, dateTime }: AccessLogRowProps) {
  return (
    <div style={rowStyle}>
      <span>📄 {doc}</span>
      <span>🧑🏾 {partner}</span>
      <span>⏱️ {dateTime}</span>
    </div>
  );
}