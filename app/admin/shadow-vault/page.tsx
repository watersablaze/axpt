'use client';

import { useEffect, useState } from 'react';
import { ModuleCard } from '@/components/dashboard/ModuleCard';
import ModuleCardGrid from '@/components/dashboard/ModuleCardGrid';

type Entry = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  desiredGem: string;
  format?: string | null;
  size?: string | null;
  quantity?: string | null;
  notes?: string | null;
  createdAt: string;
};

export default function ShadowVaultAdminPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch('/api/admin/shadow-vault/entries');
        const data = await res.json();

        console.log('[🔍 Shadow Vault Entries]', data);

        if (!res.ok || !data.success || !Array.isArray(data.entries)) {
          throw new Error(data.error || 'Invalid response from server.');
        }

        setEntries(data.entries);
      } catch (err: any) {
        console.error('[❌ FETCH ERROR]', err);
        setError(err.message || 'Unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const filteredEntries = entries.filter((entry) => {
    const search = filter.toLowerCase();
    return (
      entry.name.toLowerCase().includes(search) ||
      entry.email.toLowerCase().includes(search) ||
      entry.desiredGem.toLowerCase().includes(search)
    );
  });

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2>💎 Shadow Vault Submissions</h2>

      <input
        type="text"
        placeholder="Search by name, email, or gem..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          padding: '0.5rem',
          width: '100%',
          maxWidth: '400px',
          margin: '1rem 0',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      />

      {loading && <p>⏳ Loading entries...</p>}
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
      {!loading && !error && filteredEntries.length === 0 && (
        <p>No matching entries found.</p>
      )}

      <ModuleCardGrid>
        {filteredEntries.map((entry) => (
          <ModuleCard
            key={entry.id}
            id={entry.id}
            name={entry.name}
            email={entry.email}
            phone={entry.phone || undefined}
            desiredGem={entry.desiredGem}
            format={entry.format || undefined}
            size={entry.size || undefined}
            quantity={entry.quantity || undefined}
            notes={entry.notes || undefined}
            createdAt={entry.createdAt}
          />
        ))}
      </ModuleCardGrid>
    </div>
  );
}