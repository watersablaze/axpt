// 📁 app/components/dashboard/EntryDrawer.tsx

'use client';
import { useEffect } from 'react';

export interface Entry {
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
}

interface EntryDrawerProps {
  entry: Entry;
  onClose: () => void;
}

export function EntryDrawer({ entry, onClose }: EntryDrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative bg-[#111] text-white w-full sm:w-[420px] h-full shadow-lg border-l border-[#333] p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">{entry.desiredGem}</h2>
        <p className="text-sm text-gray-400 mb-4">
          Submitted: {new Date(entry.createdAt).toLocaleString()}
        </p>

        <div className="space-y-2 text-gray-200">
          <p><strong>👤 Name:</strong> {entry.name}</p>
          <p><strong>📧 Email:</strong> {entry.email}</p>
          {entry.phone && <p><strong>📱 Phone:</strong> {entry.phone}</p>}
          <p><strong>🧊 Format:</strong> {entry.format || '—'}</p>
          <p><strong>📐 Size:</strong> {entry.size || '—'}</p>
          <p><strong>🔢 Quantity:</strong> {entry.quantity || '—'}</p>
          {entry.notes && (
            <p><strong>📝 Notes:</strong> <span className="italic text-gray-400">“{entry.notes}”</span></p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 text-indigo-400 hover:text-indigo-200 text-sm"
        >
          ← Close Drawer
        </button>
      </div>
    </div>
  );
}