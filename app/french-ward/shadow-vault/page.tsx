'use client';

import dynamic from 'next/dynamic';

const ShadowVaultPage = dynamic(() => import('./ShadowVaultPage'), { ssr: false });

export default ShadowVaultPage;