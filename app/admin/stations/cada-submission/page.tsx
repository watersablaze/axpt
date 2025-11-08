// ✅ File: app/admin/stations/cada-submissions/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Submission = {
  email: string;
  joinedAtISO: string;
};

export default function CadaSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    // For now, simulate fetch
    setTimeout(() => {
      setSubmissions([
        { email: 'friend1@example.com', joinedAtISO: '2025-10-01T12:00:00Z' },
        { email: 'ally2@example.com', joinedAtISO: '2025-10-07T08:42:00Z' },
      ]);
    }, 500);
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">📬 CADA Submissions</h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Joined At</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s, i) => (
            <tr key={i} className="hover:bg-gray-100">
              <td className="p-2 border">{s.email}</td>
              <td className="p-2 border">{new Date(s.joinedAtISO).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}