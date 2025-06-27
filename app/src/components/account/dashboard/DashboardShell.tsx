'use client';

import { ReactNode } from 'react';
import InvestorModules from './InvestorModule';
import PartnerModules from './PartnerModules';
import FarmerModules from './FarmerModules';

export default function DashboardShell({
  tier,
  children,
}: {
  tier: string;
  children?: ReactNode;
}) {
  const renderModules = () => {
    switch (tier.toLowerCase()) {
      case 'investor':
        return <InvestorModules />;
      case 'partner':
        return <PartnerModules />;
      case 'farmer':
        return <FarmerModules />;
      default:
        return (
          <div className="text-center text-gray-400">
            🧭 Welcome Explorer. Modules will appear once your role is assigned.
          </div>
        );
    }
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {renderModules()}
      {children}
    </section>
  );
}