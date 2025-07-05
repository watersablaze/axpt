import { notFound } from 'next/navigation';
import VaultIframeClient from './VaultIframeClient';

export default async function VaultDocPage({ params }: any) {
  const docId = decodeURIComponent(params?.doc ?? '');
  if (!docId) return notFound();

  return <VaultIframeClient doc={docId} />;
}