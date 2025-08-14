// app/dashboard/layout.tsx
import type { ReactNode } from 'react';
import '@/styles/dashboard.css';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>AXPT Admin</h2>
        <nav>
          <ul>
            <li><a href="/dashboard/db-monitor">📡 DB Monitor</a></li>
            <li><a href="/dashboard/shadow-vault">💎 Shadow Vault</a></li>
          </ul>
        </nav>
      </aside>
      <main className="main">
        {children}
      </main>
    </div>
  );
}