import React from 'react';

export interface AdminStatCardProps {
  title: string;
  value: number | string;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  borderRadius: '12px',
  padding: '1rem 1.5rem',
  textAlign: 'center',
  background: '#f9f9f9',
  boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  flex: '1 1 200px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 'bold',
  color: '#444'
};

const valueStyle: React.CSSProperties = {
  fontSize: '2rem',
  color: '#0070f3'
};

export default function AdminStatCard({ title, value }: AdminStatCardProps) {
  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}