// src/components/devtools/TabsRegistry.ts
import LiveTab from '@/components/devtools/LiveTab';
import SystemTab from './tabs/SystemTab';
import AuraTab from './tabs/AuraTab';
import BloomTab from './tabs/BloomTab';
import CeremonyTab from './tabs/CeremonyTab';

export const TABS = {
  live: LiveTab, // ⭐ entry portal
  system: SystemTab,
  aura: AuraTab,
  bloom: BloomTab,
  ceremony: CeremonyTab,
};

// "keyof typeof TABS" ensures tab names are type-safe everywhere
export type TabKey = keyof typeof TABS;

export function resolveTab(tab: string): React.ComponentType<any> {
  return (TABS as Record<string, React.ComponentType<any>>)[tab] ?? TABS.system;
}