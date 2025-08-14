// ✅ page.tsx — route entry with DEV-only gate and dynamic import
'use client';

import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

const isDev = process.env.NODE_ENV === 'development';

// ✅ Proper dynamic import with `.then(mod => mod.default)`
const DbMonitorDashboard = dynamic(
  () =>
    import('@/components/dashboard/DbMonitorDashboard').then(
      (mod) => mod.default
    ),
  { ssr: false }
);

// ✅ Export gated component
export default function PageComponent() {
  return isDev ? <DbMonitorDashboard /> : notFound();
}