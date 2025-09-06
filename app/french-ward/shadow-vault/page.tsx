'use client';
import dynamic from 'next/dynamic';

const ShadowVaultWrapper = dynamic(() => import('./ShadowVaultWrapper'), { ssr: false });
export default ShadowVaultWrapper;