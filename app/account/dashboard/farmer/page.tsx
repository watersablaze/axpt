// app/account/dashboard/farmer/page.tsx
import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import DashboardShell from '@/components/account/dashboard/DashboardShell';

export default function FarmerDashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardShell tier="farmer" />
    </ProtectedLayout>
  );
}