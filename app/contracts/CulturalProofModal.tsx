'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import styles from './ContractsPage.module.css';

interface CulturalProofModalProps {
  contractId: string;
  onClose: () => void;
}

export default function CulturalProofModal({ contractId, onClose }: CulturalProofModalProps) {
  const [form, setForm] = useState({
    artist: '',
    title: '',
    medium: '',
    statement: '',
    ipfsHash: '',
    signature: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/cultural-proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, smartContractId: contractId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Cultural Proof added');
      onClose();
    } catch (err: any) {
      toast.error('Error adding proof', { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalInner}>
        <h3>Add Cultural Proof</h3>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Artist"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
            required
          />
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            placeholder="Medium (film, ritual, etc.)"
            value={form.medium}
            onChange={(e) => setForm({ ...form, medium: e.target.value })}
          />
          <textarea
            placeholder="Statement or description"
            value={form.statement}
            onChange={(e) => setForm({ ...form, statement: e.target.value })}
          />
          <input
            placeholder="IPFS hash / link (optional)"
            value={form.ipfsHash}
            onChange={(e) => setForm({ ...form, ipfsHash: e.target.value })}
          />
          <input
            placeholder="Signature (optional)"
            value={form.signature}
            onChange={(e) => setForm({ ...form, signature: e.target.value })}
          />
          <div className={styles.modalActions}>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save Proof'}
            </button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}