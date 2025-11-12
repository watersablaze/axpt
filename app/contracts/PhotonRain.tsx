'use client';

import {
  motion,
  useTransform,
  useMotionTemplate,
  useScroll,
  useVelocity,
  useSpring,
  useTime,
} from 'framer-motion';
import { useRef, useMemo } from 'react';
import styles from './PhotonRain.module.css';

export default function PhotonRain() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });

  // Hue & slight brightness from position (emerald → gold → white)
  const hue = useTransform(scrollYProgress, [0, 1], [160, 35]);
  const posBrightness = useTransform(scrollYProgress, [0, 1], [1.0, 1.08]);
  const baseFilter = useMotionTemplate`hue-rotate(${hue}deg) brightness(${posBrightness})`;

  // Scroll velocity → subtle energy response
  const rawV = useVelocity(scrollYProgress);
  const v = useSpring(rawV, { stiffness: 40, damping: 22, mass: 0.6 });
  const energyScale = useTransform(v, [-0.5, 0, 0.5], [0.96, 1.04, 0.96]);
  const energyBright = useTransform(v, [-0.5, 0, 0.5], [0.95, 1.05, 0.95]);

  // Breath sync (10s) → gentle inhale/exhale
  const t = useTime();
  const breath = useTransform(t, v => 0.98 + 0.04 * Math.sin((v / 10000) * 2 * Math.PI));
  const breathBright = useTransform(t, v => 0.97 + 0.05 * Math.sin((v / 10000) * 2 * Math.PI));
  const finalFilter = useMotionTemplate`
    ${baseFilter} brightness(${energyBright} * ${breathBright})
  `;

  const photons = useMemo(() => {
    const count = 28; // fewer, calmer
    return Array.from({ length: count }).map(() => ({
      id: crypto.randomUUID(),
      x: Math.random(),          // 0..1 (we’ll map to viewport)
      depth: Math.random(),      // parallax feel
      delay: Math.random() * 6,
      dur: 10 + Math.random() * 12,
      drift: (Math.random() - 0.5) * 20,
      flicker: Math.random() < 0.2,
    }));
  }, []);

  return (
    <motion.div ref={ref} className={styles.rainContainer} style={{ filter: finalFilter }}>
      {/* vignette mask to keep edges soft */}
      <div className={styles.vignetteMask} />

      {photons.map(p => {
        const xvw = useTransform(breath, b => `calc(${p.x * 100}vw + ${p.drift * b}px)`);
        const baseOpacity = 0.18 + p.depth * 0.22; // lower overall
        const height = 10 + p.depth * 10; // shorter streaks

        return (
          <motion.div
            key={p.id}
            className={`${styles.photon} ${p.flicker ? styles.photonFlicker : ''}`}
            style={{
              left: xvw,
              scale: energyScale,
              opacity: baseOpacity,
              height: `${height}vh`,
            }}
            initial={{ top: `-${height}vh` }}
            animate={{ top: ['-12vh', '112vh'] }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </motion.div>
  );
}