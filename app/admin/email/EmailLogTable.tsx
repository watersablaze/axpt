'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface EmailLog {
  id: number;
  type?: string | null;
  to?: string | null;
  from?: string | null;
  subject?: string | null;
  status?: string | null;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  emails: EmailLog[];
  totalPages: number;
  page: number;
  totalCount: number;
}

export default function EmailLogTable() {
  const [data, setData] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  async function fetchEmails(p = page, s = search) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/emails?page=${p}&limit=20${s ? `&search=${encodeURIComponent(s)}` : ''}`
      );
      const json: ApiResponse = await res.json();
      if (json.success) {
        setData(json.emails);
        setTotalPages(json.totalPages);
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmails(1, '');
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    fetchEmails(1, search);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-md">
      <form onSubmit={handleSearch} className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Search by recipient or subject..."
          className="flex-1 px-3 py-2 bg-neutral-800 text-white rounded-md focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="submit"
          className="ml-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading emails...
        </div>
      ) : (
        <>
          <table className="w-full text-sm text-gray-300 border-collapse">
            <thead className="bg-neutral-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">To</th>
                <th className="p-2 text-left">Subject</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((email) => (
                <tr
                  key={email.id}
                  className="border-b border-neutral-800 hover:bg-neutral-800/50 transition"
                >
                  <td className="p-2">{email.type || '—'}</td>
                  <td className="p-2">{email.to || '—'}</td>
                  <td className="p-2 truncate max-w-[240px]">{email.subject || '—'}</td>
                  <td
                    className={`p-2 ${
                      email.status === 'failed'
                        ? 'text-red-500'
                        : email.status === 'sent'
                        ? 'text-emerald-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {email.status || '—'}
                  </td>
                  <td className="p-2 text-gray-400">
                    {new Date(email.createdAt).toLocaleString()}
                  </td>
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
                fetchEmails(newPage);
              }}
              className="flex items-center gap-1 text-sm text-gray-400 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            <span className="text-gray-500 text-sm">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => {
                const newPage = Math.min(page + 1, totalPages);
                setPage(newPage);
                fetchEmails(newPage);
              }}
              className="flex items-center gap-1 text-sm text-gray-400 disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}