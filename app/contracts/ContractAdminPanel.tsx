'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import styles from './ContractsPage.module.css';

export default function ContractAdminPanel({
  onNewContract,
}: {
  onNewContract?: (contract: any) => void;
}) {
  const [form, setForm] = useState({ name: '', address: '', network: '', description: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('New contract added');
      onNewContract?.(data);
      setForm({ name: '', address: '', network: '', description: '' });
    } catch (err: any) {
      toast.error('Error adding contract', { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.adminPanel}>
      <h3>Add New Contract</h3>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        required
      />
      <input
        placeholder="Network"
        value={form.network}
        onChange={(e) => setForm({ ...form, network: e.target.value })}
        required
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Add Contract'}
      </button>
    </form>
  );
}