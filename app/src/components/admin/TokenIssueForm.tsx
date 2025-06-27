'use client';

import React, { useState } from 'react';
import styles from '@/styles/AdminIssue.module.css';
import TokenVerifier from './TokenVerifier';

interface TokenIssueFormProps {
  onIssue: () => void;
}

const AVAILABLE_DOCS = [
  'AXPT-Whitepaper.pdf',
  'Hemp_Ecosystem.pdf',
  'CIM_Chinje.pdf'
];

export default function TokenIssueForm({ onIssue }: TokenIssueFormProps) {
  const [partner, setPartner] = useState('');
  const [tier, setTier] = useState('Investor');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [newDoc, setNewDoc] = useState('');
  const [issuedToken, setIssuedToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [showVerifier, setShowVerifier] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIssuedToken('');
    setCopied(false);

    if (!partner || selectedDocs.length === 0) {
      setError('Please enter a partner ID and select at least one document.');
      return;
    }

    const response = await fetch('/api/admin/tokens/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner, tier, docs: selectedDocs })
    });

    const result = await response.json();

    if (response.ok) {
      setIssuedToken(result.token);
      onIssue();
    } else {
      setError(result.error || 'Unknown error');
    }
  };

  const normalizePartnerInput = (value: string) => {
    const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    setPartner(slug);
  };

  const handleCopy = async () => {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleAddNewDoc = () => {
    const trimmed = newDoc.trim();
    if (trimmed && !selectedDocs.includes(trimmed)) {
      setSelectedDocs([...selectedDocs, trimmed]);
      setNewDoc('');
    }
  };

  const onboardingLink = issuedToken ? `/onboard?token=${encodeURIComponent(issuedToken)}` : '';

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Partner ID:
          <input
            type="text"
            value={partner}
            placeholder="e.g. afro-tech-alliance"
            onChange={e => normalizePartnerInput(e.target.value)}
            className={styles.input}
            required
          />
          <small className={styles.helper}>
            This will be used as a unique partner identifier (lowercase, hyphenated).
          </small>
        </label>

        <label>
          Tier:
          <select
            value={tier}
            onChange={e => setTier(e.target.value)}
            className={styles.input}
          >
            <option value="Investor">Investor</option>
            <option value="Board">Board</option>
            <option value="Partner">Partner</option>
          </select>
        </label>

        <label>
          Select Docs:
          <select
            multiple
            value={selectedDocs}
            onChange={e =>
              setSelectedDocs(Array.from(e.target.selectedOptions, opt => opt.value))
            }
            className={styles.input}
          >
            {AVAILABLE_DOCS.map(doc => (
              <option key={doc} value={doc}>{doc}</option>
            ))}
          </select>
        </label>

        <label>
          Add Custom Doc:
          <input
            type="text"
            value={newDoc}
            onChange={e => setNewDoc(e.target.value)}
            className={styles.input}
            placeholder="Enter custom doc filename"
          />
          <button
            type="button"
            onClick={handleAddNewDoc}
            className={styles.button}
            style={{ marginTop: '0.5rem' }}
          >
            Add Doc
          </button>
        </label>

        <button type="submit" className={styles.button}>Issue Token</button>

        {error && <p className={styles.error}>❌ {error}</p>}

        {issuedToken && (
          <div className={styles.tokenBox}>
            <strong>✅ Token:</strong>
            <pre>{issuedToken}</pre>
            <button type="button" onClick={handleCopy} className={styles.copyButton}>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            {onboardingLink && (
              <a
                href={onboardingLink}
                className={styles.linkButton}
                target="_blank"
                rel="noopener noreferrer"
              >
                → Visit Onboarding Page
              </a>
            )}
          </div>
        )}
      </form>

      <div className={styles.panel} style={{ marginTop: '2rem' }}>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setShowVerifier(!showVerifier)}
        >
          {showVerifier ? '➖ Hide Token Verifier' : '➕ Show Token Verifier'}
        </button>

        {showVerifier && (
          <div className={styles.verifierPanel}>
            <TokenVerifier />
          </div>
        )}
      </div>
    </>
  );
}