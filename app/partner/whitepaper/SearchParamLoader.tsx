'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Props {
  onTokenDetected: (token: string) => void;
}

export default function SearchParamLoader({ onTokenDetected }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      onTokenDetected(urlToken.trim());

      // Clean up the URL (Safari-safe)
      const newSearch = new URLSearchParams(searchParams.toString());
      newSearch.delete('token');
      router.replace(`?${newSearch.toString()}`, { scroll: false });
    }
  }, [searchParams, onTokenDetected, router]);

  return null;
}