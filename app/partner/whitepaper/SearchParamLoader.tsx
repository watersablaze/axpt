'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Props {
  onTokenDetected: (token: string) => void;
}

export default function SearchParamLoader({ onTokenDetected }: Props) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) onTokenDetected(urlToken.trim());
  }, [searchParams, onTokenDetected]);

  return null;
}