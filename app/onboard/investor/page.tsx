'use client';

import React, { useState } from 'react';
import WelcomeScreen from '@/components/shared/WelcomeScreen';
import TokenGate from '@/components/shared/TokenGate';
import VerifiedDashboard from '@/components/shared/VerifiedDashboard';

export default function InvestorOnboardingPage() {
  const [consented, setConsented] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  if (!consented) {
    return <WelcomeScreen onAccept={() => setConsented(true)} />;
  }

  if (!token) {
    return (
      <TokenGate
        token=""
        onVerified={(partner, tier, newToken, docs) => {
          setToken(newToken);
          return (
            <VerifiedDashboard
              partner={partner}
              tier={tier}
              token={newToken}
              docs={docs}
            />
          );
        }}
      />
    );
  }

  // Token already verified — show dashboard
  return (
    <VerifiedDashboard
      partner="Unknown"
      tier="Unknown"
      token={token}
      docs={[]}
    />
  );
}