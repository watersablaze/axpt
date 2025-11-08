// 📁 components/onboarding/DocTabBar.tsx
'use client';

import styles from './DocTabBar.module.css';
import { DocCategory } from './useDocVaultState';

type DocTabBarProps = {
  activeTab: DocCategory;
  setActiveTab: (tab: DocCategory) => void;
};

const categories: DocCategory[] = ['All', 'Whitepaper', 'Proposals']; // ✅ Match updated type

export function DocTabBar({ activeTab, setActiveTab }: DocTabBarProps) {
  return (
    <nav className={styles.tabBar}>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`${styles.tab} ${cat === activeTab ? styles.active : ''}`}
          onClick={() => setActiveTab(cat)}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}