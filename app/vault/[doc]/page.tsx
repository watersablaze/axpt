export const runtime = 'nodejs';

import { notFound } from 'next/navigation';
import VaultIframeClient from './VaultIframeClient';

// Explicitly cast to `any` to bypass the broken PageProps constraint
export default function VaultDocPage(props: any) {
  const docId = decodeURIComponent(props?.params?.doc ?? '');

  if (!docId) return notFound();

  return <VaultIframeClient doc={docId} />;
}