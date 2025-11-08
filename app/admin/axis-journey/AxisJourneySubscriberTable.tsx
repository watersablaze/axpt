'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, Filter, CheckCircle, XCircle } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  name?: string | null;
  origin?: string | null;
  confirmed?: boolean;
  joinedAt: string;
}

interface ApiResponse {
  success: boolean;
  subscribers: Subscriber[];
  totalPages: number;
  page: number;
  totalCount: number;
}

export default function AxisJourneySubscriberTable() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'unconfirmed'>('all');

  async function fetchSubscribers(p = page, s = search, f = filter) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: '20',
      });
      if (s) params.set('search', s);
      if (f !== 'all') params.set('filter', f);

      const res = await fetch(`/api/admin/axis-journey?${params.toString()}`);
      const json: ApiResponse = await res.json();
      if (json.success) {
        setSubscribers(json.subscribers);
        setTotalPages(json.totalPages);
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    fetchSubscribers(1, search, filter);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-md">
      {/* Search and Filter */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row sm:items-center mb-4 gap-2">
        <input
          type="text"
          placeholder="Search by email or origin..."
          className="flex-1 px-3 py-2 bg-neutral-800 text-white rounded-md focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as any);
            fetchSubscribers(1, search, e.target.value as any);
          }}
          className="bg-neutral-800 text-white px-3 py-2 rounded-md border border-neutral-700"
        >
          <option value="all">All</option>
          <option value="confirmed">Confirmed</option>
          <option value="unconfirmed">Unconfirmed</option>
        </select>
        <button
          type="submit"
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading subscribers...
        </div>
      ) : (
        <>
          <table className="w-full text-sm text-gray-300 border-collapse">
            <thead className="bg-neutral-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Origin</th>
                <th className="p-2 text-left">Confirmed</th>
                <th className="p-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition">
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{s.origin || '—'}</td>
                  <td className="p-2">
                    {s.confirmed ? (
                      <span className="flex items-center text-emerald-400 gap-1">
                        <CheckCircle className="w-4 h-4" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-500 gap-1">
                        <XCircle className="w-4 h-4" /> No
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-gray-400">{new Date(s.joinedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={page <= 1}
              onClick={() => {
                const newPage = Math.max(page - 1, 1);
                setPage(newPage);
                fetchSubscribers(newPage, search, filter);
              }}
              className="text-sm text-gray-400 disabled:opacity-40"
            >
              ← Prev
            </button>

            <span className="text-gray-500 text-sm">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => {
                const newPage = Math.min(page + 1, totalPages);
                setPage(newPage);
                fetchSubscribers(newPage, search, filter);
              }}
              className="text-sm text-gray-400 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}