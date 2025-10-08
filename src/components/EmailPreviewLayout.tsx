// 📁 components/EmailPreviewLayout.tsx

import React from 'react';

type Props = {
  children: React.ReactNode;
  title: string;
  bgColor?: string;
  textColor?: string;
};

export default function EmailPreviewLayout({
  children,
  title,
  bgColor = '#f4f4f4',
  textColor = '#000000',
}: Props) {
  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>{title}</h1>
      <div>{children}</div>
    </div>
  );
}