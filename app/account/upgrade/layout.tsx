// app/account/upgrade/layout.tsx
import type { ReactNode } from 'react';
import '@/styles/upgrade.css';

export default function UpgradeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="upgrade-container">
      <header className="upgrade-header">
        <h1 className="upgrade-title">🪞 Account Upgrade Ceremony</h1>
      </header>
      <section className="upgrade-content">
        {children}
      </section>
    </div>
  );
}