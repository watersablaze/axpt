'use client';

import { useRouter } from 'next/navigation';

type Props = {
  className?: string;
  label?: string;
};

export default function ReturnToDashboardButton({
  className = '',
  label = '⬅ Return to Dashboard',
}: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/onboard/investor/dashboard?verified=1')}
      className={`mt-6 px-4 py-2 text-black bg-white rounded-md hover:bg-gray-200 transition-colors font-semibold ${className}`}
    >
      {label}
    </button>
  );
}