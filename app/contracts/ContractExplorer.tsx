'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import styles from './ContractsPage.module.css';
import CulturalProofModal from './CulturalProofModal';

interface Proof {
  id: string;
  artist: string;
  title: string;
  medium?: string;
  statement?: string;
  ipfsHash?: string;
  createdAt: string;
}

interface ContractData {
  id: string;
  name: string;
  address: string;
  network: string;
  description?: string;
  status: string;
  isActive: boolean;
  verified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function ContractExplorer({
  contracts,
  loading,
  isElder,
  onUpdate,
}: {
  contracts: ContractData[];
  loading: boolean;
  isElder?: boolean;
  onUpdate?: (updated: ContractData) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, Proof[]>>({});
  const [showProofModal, setShowProofModal] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  async function toggleExpand(id: string) {
    setExpanded(expanded === id ? null : id);
    if (!proofs[id]) {
      try {
        const res = await fetch(`/api/cultural-proofs/${id}`);
        const data = await res.json();
        setProofs((prev) => ({ ...prev, [id]: data }));
      } catch (err: any) {
        toast.error('Error loading proofs', { description: err.message });
      }
    }
  }

  if (loading) return <p className="text-center text-gray-400">Loading contracts…</p>;

  const list = (showArchived ? contracts.filter(c => !c.isActive) : contracts.filter(c => c.isActive))
    .sort((a,b) => (a.name > b.name ? 1 : -1));

  return (
    <div className={styles.explorer}>
      <div className={styles.explorerHeaderBar}>
        <div className={styles.headerTitle}>
          {showArchived ? 'Archived Contracts' : 'Active Contracts'}
        </div>
        {isElder && (
          <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            <span>Show Archived</span>
          </label>
        )}
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Contract</th>
            <th>Network</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Updated</th>
            {isElder && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {list.map((c) => {
            const isOpen = expanded === c.id;
            const proofCount = proofs[c.id]?.length ?? 0;

            return (
              <tr key={c.id}>
                <td>
                  <button className={styles.expandBtn} onClick={() => toggleExpand(c.id)}>
                    {isOpen ? '▼' : '▶'} {c.name}
                  </button>
                  {isOpen && (
                    <span className={styles.proofCountWrapper}>
                      <span className={styles.proofCount}>
                        {proofCount} {proofCount === 1 ? 'Proof' : 'Proofs'}
                      </span>
                      <button
                        onClick={() => toggleExpand(c.id)}
                        title="Refresh Proofs"
                        className={styles.refreshBtn}
                      >
                        ⟳
                      </button>
                    </span>
                  )}
                  <div style={{ opacity: .7, fontSize: '.8rem' }}>
                    <code>{c.address.slice(0, 8)}…{c.address.slice(-6)}</code>
                  </div>

                  {isOpen && (
                    <div className={styles.proofRow}>
                      <table style={{ width: '100%' }}>
                        <tbody>
                          <tr>
                            <td colSpan={6}>
                              {proofs[c.id] ? (
                                proofs[c.id].length ? (
                                  <ul className={styles.proofList}>
                                    {proofs[c.id].map((p) => (
                                      <li key={p.id} className={styles.proofItem}>
                                        <div className={styles.proofTitle}>{p.title}</div>
                                        <div className={styles.proofMeta}>
                                          {p.artist}{p.medium ? ` • ${p.medium}` : ''}
                                        </div>
                                        {p.statement && (
                                          <p className={styles.proofStatement}>{p.statement}</p>
                                        )}
                                        {p.ipfsHash && (
                                          <a
                                            className={styles.proofLink}
                                            href={`https://ipfs.io/ipfs/${p.ipfsHash}`}
                                            target="_blank" rel="noreferrer"
                                          >
                                            View Proof ↗
                                          </a>
                                        )}
                                        <small className={styles.proofMeta}>
                                          {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                                        </small>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className={styles.proofMeta}>No cultural proofs yet.</p>
                                )
                              ) : (
                                <p className={styles.proofMeta}>Loading proofs…</p>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </td>

                <td>{c.network}</td>
                <td>{c.status}</td>
                <td>
                  <span className={`${styles.verifyBadge} ${c.verified ? styles.verified : styles.unverified}`}>
                    {c.verified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td>
                  {c.updatedAt ? formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true }) : '—'}
                </td>

                {isElder && (
                  <td>
                    {c.verified && (
                      <button
                        onClick={() => setShowProofModal(c.id)}
                        className={styles.iconBtn}
                        title="Add Cultural Proof"
                      >
                        🪶
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {showProofModal && (
        <CulturalProofModal contractId={showProofModal} onClose={() => setShowProofModal(null)} />
      )}
    </div>
  );
}