'use client';

import React from 'react';
import styles from './gateBox.module.css';
import clsx from 'clsx';

interface OrbContainerProps {
  children: React.ReactNode;
  layout?: 'centered' | 'topAligned';
  className?: string;
  fadeOut?: boolean;
}

export function OrbContainer({
  children,
  layout = 'centered',
  className = '',
  fadeOut = false,
}: OrbContainerProps) {
  return (
    <div className={clsx(
      styles.orbBox,
      styles[layout],
      fadeOut && styles.fadeOutSoft,
      className
    )}>
      <div className={styles.orbContainerAura} />
      {children}
    </div>
  );
}