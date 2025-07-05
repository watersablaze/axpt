'use client';

import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import { useRouter } from 'next/navigation';

export default function InvestorOnboardPage() {
  const router = useRouter();

  return (
    <WelcomeScreen onAcceptAction={() => router.push('/onboard/investor')} />
  );
}