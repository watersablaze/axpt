// components/OnboardingSuccessScreen.tsx

'use client';

import VerificationSuccessScreen from '@/components/VerificationSuccessScreen';
import SharedDocViewer from 'staging/SharedDocViewer';
import TierBadge from '@/components/shared/TierBadge';
import InvestorGreeting from '@/components/InvestorGreeting';
import InvestorCTA from '@/components/InvestorCTA';

interface OnboardingSuccessScreenProps {
  partner: string;
  tier: string;
  docs: string[];
  token: string;
}

export default function OnboardingSuccessScreen({
  partner,
  tier,
  docs,
  token,
}: OnboardingSuccessScreenProps) {
  return (
    <div style={{ padding: '1.5rem', position: 'relative' }}>
      {/* 🔷 Persistent Badge */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 50 }}>
        <TierBadge tier={tier} />
      </div>

      {/* 🟢 Entry Animation */}
      <VerificationSuccessScreen onComplete={() => console.log('✓ Verified')} />

      {/* 🙏🏾 Personalized Welcome */}
      <InvestorGreeting name={partner} tier={tier} />

      {/* 📄 Docs Viewer */}
      <SharedDocViewer token={token} docs={docs} />

      {/* 🔗 CTA */}
      <InvestorCTA />
    </div>
  );
}