'use client';
import React from 'react';
import styles from './TierBadge.module.css';

type Tier = 'Investor' | 'Board' | 'Crown' | string;

interface TierBadgeProps {
  tier: Tier;
  className?: string;
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = '' }) => {
  const getTierStyle = (tier: Tier) => {
    switch (tier.toLowerCase()) {
      case 'investor': return styles.investor;
      case 'board': return styles.board;
      case 'crown': return styles.crown;
      default: return styles.default;
    }
  };

  return (
    <span className={`${styles.badge} ${getTierStyle(tier)} ${className}`}>{tier}</span>
  );
};

export default TierBadge;