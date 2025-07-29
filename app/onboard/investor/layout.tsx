// ✅ FILE: app/onboard/investor/layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AXPT.io Portal',
  description: 'Investor access and secure onboarding for AXPT ecosystem.',
};

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}