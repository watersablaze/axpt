'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CaseMode = 'COORDINATION_ONLY' | 'FULL_ESCROW';

export default function CreateCaseWizard() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [mode, setMode] = useState<CaseMode>('COORDINATION_ONLY');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function initiateCase() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/axpt/cases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          jurisdiction: jurisdiction || undefined,
          mode,
          actor: 'ADMIN_UI',
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? 'INITIATION_FAILED');
        setSubmitting(false);
        return;
      }

      router.push(`/app/admin/cases/${json.case.id}`);
    } catch (e: any) {
      setError('NETWORK_ERROR');
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2>Initiate Case</h2>

      <label>
        Case Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mali Gold Coordination – Batch A"
        />
      </label>

      <label>
        Jurisdiction
        <input
          type="text"
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          placeholder="e.g. Mali, South Africa, International"
        />
      </label>

      <fieldset>
        <legend>Mode</legend>

        <label>
          <input
            type="radio"
            checked={mode === 'COORDINATION_ONLY'}
            onChange={() => setMode('COORDINATION_ONLY')}
          />
          Coordination Only
        </label>

        <label>
          <input
            type="radio"
            checked={mode === 'FULL_ESCROW'}
            onChange={() => setMode('FULL_ESCROW')}
          />
          Full Escrow (Gate 4 Required)
        </label>
      </fieldset>

      {error && (
        <p style={{ color: 'red', marginTop: 8 }}>
          Error: {error}
        </p>
      )}

      <button
        onClick={initiateCase}
        disabled={submitting || title.trim().length === 0}
      >
        {submitting ? 'Initiating…' : 'Initiate Case'}
      </button>
    </div>
  );
}