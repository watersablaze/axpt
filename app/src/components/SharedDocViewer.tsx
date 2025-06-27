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
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '2rem', color: '#fff' }}>
      {/* Floating Toolbar */}
      <div style={{
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
      }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#d8b4fe' }}>📁 Documents for Verified Token</span>
        <Link href="/account/dashboard" style={{ color: '#c084fc', textDecoration: 'none' }}>← Dashboard</Link>
      </div>

      {/* Document Grid */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {docs.map((doc, i) => (
          <div key={i} style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <h4 style={{ color: '#f3f3f3', fontWeight: 'bold' }}>{readableLabel(doc)}</h4>
            <p style={{ fontSize: '0.85rem', color: '#ccc' }}>📄 {doc}</p>
            <div style={{ marginTop: '0.75rem' }}>
              <a href={`/docs/${doc}`} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd' }}>🔍 View</a> |{' '}
              <a href={`/docs/${doc}`} download style={{ color: '#fcd34d' }}>⬇️ Download</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}