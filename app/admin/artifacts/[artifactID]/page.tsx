import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function ArtifactViewer({
  params,
}: {
  params: { artifactId: string };
}) {
  const artifact = await prisma.artifact.findUnique({
    where: { id: params.artifactId },
  });

  if (!artifact) notFound();

  const isPdf = artifact.mimeType === 'application/pdf';
  const isJson = artifact.mimeType === 'application/json';

  return (
    <section style={{ padding: '2rem', maxWidth: 960 }}>
      {/* ── Header ───────────────────────── */}
      <h1 style={{ marginBottom: '0.25rem' }}>{artifact.name}</h1>

      <div style={{ fontSize: '0.9rem', color: '#555' }}>
        <div>
          <strong>Type:</strong> {artifact.type}
        </div>
        <div>
          <strong>Issued:</strong>{' '}
          {new Date(artifact.createdAt).toLocaleString()}
        </div>
        <div>
          <strong>Source:</strong> {artifact.source}
        </div>
        <div>
          <strong>SHA-256:</strong>{' '}
          <code>{artifact.hash}</code>
        </div>
      </div>

      <hr style={{ margin: '1.5rem 0' }} />

      {/* ── Preview ─────────────────────── */}
      <h2 style={{ fontSize: '1.1rem' }}>Preview</h2>

      {isPdf && artifact.storagePath && (
        <iframe
          src={artifact.storagePath}
          style={{
            width: '100%',
            height: '70vh',
            border: '1px solid #ddd',
            borderRadius: 6,
            marginTop: '1rem',
          }}
        />
      )}

      {isJson && artifact.storagePath && (
        <pre
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#111',
            color: '#eee',
            borderRadius: 6,
            maxHeight: '70vh',
            overflow: 'auto',
            fontSize: '0.85rem',
          }}
        >
          {/* JSON should be served directly by storagePath */}
          <code>Open raw JSON to view contents.</code>
        </pre>
      )}

      {!isPdf && !isJson && (
        <p style={{ marginTop: '1rem', color: '#777' }}>
          No inline preview available for this artifact type.
        </p>
      )}

      <hr style={{ margin: '2rem 0' }} />

      {/* ── Actions ─────────────────────── */}
      <a
        href={artifact.storagePath ?? '#'}
        download
        style={{
          display: 'inline-block',
          padding: '0.6rem 1rem',
          background: '#000',
          color: '#fff',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Download Original
      </a>
    </section>
  );
}