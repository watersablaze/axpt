// app/admin/layout.tsx
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-56 border-r border-neutral-800 p-4 space-y-4 bg-neutral-950">
        <h2 className="text-xl font-bold">AXPT Admin</h2>
        <nav className="space-y-2">
          <Link href="/admin/axis-journey" className="block hover:text-cyan-400">Axis Journey</Link>
          <Link href="/admin/cada" className="block hover:text-cyan-400">CADA Waitlist</Link>
          {/* Add future links here */}
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}