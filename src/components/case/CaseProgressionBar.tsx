// src/components/case/CaseProgressionBar.tsx
import {
  CaseProgressionInput,
  deriveProgression,
} from './caseProgression';

interface Props {
  caseData: CaseProgressionInput;
}

export default function CaseProgressionBar({ caseData }: Props) {
  const progression = deriveProgression(caseData);

  return (
    <section
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: '1rem',
        marginBottom: '2rem',
      }}
    >
      <h3 style={{ marginBottom: '0.75rem' }}>
        Case Progression
      </h3>

      {/* Case status */}
      <div style={{ marginBottom: '1rem' }}>
        <strong>Status:</strong>{' '}
        <span
          style={{
            color:
              progression.isEscrowInitiated
                ? '#7a1'
                : progression.isClosed
                ? '#555'
                : '#000',
            fontWeight: 600,
          }}
        >
          {progression.status}
        </span>
      </div>

      {/* Gates */}
      <ol style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
        {progression.gates.map((g) => (
          <li
            key={g.id}
            style={{
              marginBottom: '0.5rem',
              opacity:
                progression.isEscrowInitiated &&
                g.status !== 'VERIFIED'
                  ? 0.5
                  : 1,
            }}
          >
            <strong>
              Gate {g.ord}: {g.name}
            </strong>{' '}
            —{' '}
            <span
              style={{
                fontWeight: 600,
                color:
                  g.status === 'VERIFIED'
                    ? 'green'
                    : g.status === 'REJECTED'
                    ? 'red'
                    : '#555',
              }}
            >
              {g.status}
            </span>
          </li>
        ))}
      </ol>

      {/* Escrow indicator */}
      <div>
        <strong>Escrow:</strong>{' '}
        {progression.isEscrowInitiated ? (
          <span style={{ color: 'green', fontWeight: 600 }}>
            Initiated
          </span>
        ) : (
          <span style={{ color: '#999' }}>
            Not Initiated
          </span>
        )}
      </div>
    </section>
  );
}