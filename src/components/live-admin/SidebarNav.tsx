'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LIVE_ADMIN_LINKS } from './nav-links';
import StatusOrb from '@/components/live/StatusOrb';

export default function SidebarNav({ health }: { health: any }) {
  const pathname = usePathname();

  return (
    <aside className="sidebarNav">
      <div className="sidebarHeader">
        <h2 className="consoleLogo">Nommo Console</h2>
        <StatusOrb health={health} />
      </div>

      <nav className="sideNavList">
        {LIVE_ADMIN_LINKS.map((link) => {
          const active =
            pathname === link.href ||
            pathname.startsWith(link.href + '/');

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`navLink ${active ? 'activeNav' : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}