'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { RefObject } from 'react';

type Props = {
  scrollRef: RefObject<HTMLElement>;
};

export default function MobileBlurb({ scrollRef }: Props) {
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.2]);
  const filter = useTransform(scrollYProgress, [0, 0.15], ['blur(0px)', 'blur(1.5px)']);

  return (
    <motion.p
      initial={{ opacity: 0, color: '#065f46' }}
      animate={{ opacity: 1, color: '#34d399' }}
      transition={{ duration: 3, ease: 'easeOut' }}
      style={{
        opacity,
        filter,
        fontSize: '0.925rem',
        lineHeight: '1.65',
        fontWeight: 400,
        textAlign: 'left',
        padding: '0 1.25rem',
        maxWidth: '280px',
        marginTop: '4rem',
        marginBottom: '2rem',
        background: 'linear-gradient(90deg, rgba(16,185,129,0.1), rgba(52,211,153,0.4), rgba(16,185,129,0.1))',
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'emeraldShimmer 6s linear infinite',
      }}
    >
      AXPT.io is the threshold. A decentralized bridge for Earth-aligned currencies,
      sacred trade, and project portals powered by purpose. If you’re here, the portal
      has opened—because you carry something the future needs.
    </motion.p>
  );
}