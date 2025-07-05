// app/account/dashboard/nomad/page.tsx
import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import DashboardShell from '@/components/account/dashboard/DashboardShell';

export default function NomadDashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardShell tier="nomad" />
    </ProtectedLayout>
  );
}