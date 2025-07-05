// app/account/dashboard/partner/page.tsx
import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import DashboardShell from '@/components/account/dashboard/DashboardShell';

export default function PartnerDashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardShell tier="partner" />
    </ProtectedLayout>
  );
}