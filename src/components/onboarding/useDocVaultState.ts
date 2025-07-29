// 📁 components/onboarding/useDocVaultState.ts
import { useState } from 'react';

export type DocCategory = 'All' | 'Whitepaper' | 'Proposals';

export function useDocVaultState() {
  const [activeTab, setActiveTab] = useState<DocCategory>('All');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  return {
    activeTab,
    setActiveTab,
    selectedDoc,
    setSelectedDoc,
  };
}