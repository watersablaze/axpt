'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './SectionButton.module.css';

type SectionButtonProps = {
  children: ReactNode;
  href: string;
  target?: '_blank' | '_self';
  variant?: 'vault' | 'nommo' | 'vision' | 'contracts';
};

export default function SectionButton({
  children,
  href,
  target = '_self',
  variant = 'vault',
}: SectionButtonProps) {
  return (
    <a href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
      <button className={clsx(styles.sectionButton, styles[variant])}>{children}</button>
    </a>
  );
}