'use client';

import { ReactNode } from 'react';

export default function AdminDashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-black text-white py-4 px-6 shadow-md">
        <h1 className="text-xl font-semibold">AXPT Admin Dashboard</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}