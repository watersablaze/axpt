// app/account/dashboard/investor/page.tsx
import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import DashboardShell from '@/components/account/dashboard/DashboardShell';

export default function InvestorDashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardShell tier="investor" />
    </ProtectedLayout>
  );
}