// app/admin/AdminNav.tsx
import Link from 'next/link';

export default function AdminNav({ current }: { current?: 'projects' | 'settings' }) {
  const item =
    'px-3 py-1.5 rounded-lg border text-sm';
  const idle = 'border-zinc-800 hover:border-purple-500/60';
  const active = 'border-purple-500/70 bg-purple-500/10';

  return (
    <nav className="flex items-center gap-2">
      <Link
        href="/admin/projects"
        className={[item, current === 'projects' ? active : idle].join(' ')}
      >
        Intake
      </Link>
      <Link
        href="/admin/settings"
        className={[item, current === 'settings' ? active : idle].join(' ')}
      >
        Settings
      </Link>
    </nav>
  );
}