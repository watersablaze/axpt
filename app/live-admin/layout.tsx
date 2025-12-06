// app/live-admin/layout.tsx
import styles from './LiveAdminLayout.module.css';
import Link from 'next/link';

import { fetchOwncastHealth } from '@/lib/live/owncastClient';
import StatusOrb from '@/components/live/StatusOrb';

import { LiveProvider } from '@/context/LiveContext';
import LiveHud from '@/components/live/hud/LiveHud';

import LiveBridgeClient from '@/lib/live/LiveBridgeClient';
import NommoDebugPanel from '@/components/debug/NommoDebugPanel';

const NAV_LINKS = [
  { href: '/live-admin', label: 'Dashboard' },
  { href: '/live-admin/theme', label: 'Themes' },
  { href: '/live-admin/overlays', label: 'Overlays' },
  { href: '/live-admin/stream', label: 'Stream' },
  { href: '/live-admin/chat', label: 'Chat' },
  { href: '/live-admin/assets', label: 'Assets' },
  { href: '/live-admin/analytics', label: 'Analytics' },
  { href: '/live-admin/settings', label: 'Settings' },
];

export default async function LiveAdminLayout({ children }: { children: React.ReactNode }) {
  const health = await fetchOwncastHealth();

  return (
    <LiveProvider>

      {/* 🔌 Start WebSocket → EventBus → LiveContext */}
      <LiveBridgeClient />

      <section className={styles.adminShell}>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.logo}>Nommo Console</h2>
            <StatusOrb health={health} className={styles.statusOrb} />
          </div>

          <nav className={styles.nav}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={styles.navLink}>
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* MAIN AREA */}
        <main className={styles.content}>

          {/* Debug Console */}
          <NommoDebugPanel />

          {/* Top Bar */}
          <div className={styles.topbar}>
            <span className={styles.topTitle}>Creator Admin Console</span>
          </div>

          {/* Page Content */}
          <div className={styles.innerPane}>
            {children}
          </div>

          {/* Live HUD */}
          <LiveHud />
        </main>

      </section>

    </LiveProvider>
  );
}