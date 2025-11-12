'use client';

import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { useRef } from 'react';
import styles from './ContractsPage.module.css';
import PhotonRain from './PhotonRain';

import CodexBlock from './blocks/CodexBlock';
import TempleBlock from './blocks/TempleBlock';
import VaultBlock from './blocks/VaultBlock';
import ProofsBlock from './blocks/ProofsBlock';

export default function ContractsScroll({ isElder = false }: { isElder?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  /* 🌈 Opacity blends */
  const emeraldOpacity = useTransform(scrollYProgress, [0.0, 0.25], [1, 0]);
  const goldOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);
  const platinumOpacity = useTransform(scrollYProgress, [0.45, 0.75], [0, 1]);
  const whiteOpacity = useTransform(scrollYProgress, [0.7, 1.0], [0, 1]);

  /* ✨ Hue rotation — emerald → gold → platinum → white */
  const hue = useTransform(scrollYProgress, [0, 1], [160, 35]);
  const shimmer = useMotionTemplate`blur(90px) hue-rotate(${hue}deg)`;

  /* 🌀 Parallax transforms — subtle up/down drift for each block */
  const codexY = useTransform(scrollYProgress, [0, 0.25], [0, -60]);
  const templeY = useTransform(scrollYProgress, [0.25, 0.5], [60, -40]);
  const vaultY = useTransform(scrollYProgress, [0.5, 0.75], [40, -30]);
  const proofsY = useTransform(scrollYProgress, [0.75, 1.0], [30, 0]);

  return (
    <motion.main ref={containerRef} className={styles.snapContainer}>
          {/* ✨ Photon Rain overlay */}
       <PhotonRain />
      {/* === Atmospheric Layers === */}
      <motion.div
        className={styles.mistLayer}
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(0,255,180,0.10), rgba(0,0,0,0.9) 80%)',
          opacity: emeraldOpacity,
          filter: shimmer,
        }}
      />
      <motion.div
        className={styles.mistLayer}
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(255,230,120,0.10), rgba(0,0,0,0.9) 80%)',
          opacity: goldOpacity,
          filter: shimmer,
        }}
      />
      <motion.div
        className={styles.mistLayer}
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(245,245,255,0.10), rgba(0,0,0,0.9) 80%)',
          opacity: platinumOpacity,
          filter: shimmer,
        }}
      />
      <motion.div
        className={styles.mistLayer}
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.12), rgba(0,0,0,0.9) 80%)',
          opacity: whiteOpacity,
          filter: shimmer,
        }}
      />

      {/* === Sequential Blocks with Parallax === */}
      <motion.div style={{ y: codexY }}>
        <CodexBlock />
      </motion.div>

      <motion.div style={{ y: templeY }}>
        <TempleBlock />
      </motion.div>

      <motion.div style={{ y: vaultY }}>
        <VaultBlock />
      </motion.div>

      <motion.div style={{ y: proofsY }}>
        <ProofsBlock />
      </motion.div>

      {/* === Elder Console (optional) === */}
      {isElder && (
        <div className={`${styles.elderActions} mt-24`}>
          <h3 className="text-lg font-semibold text-emerald-300">
            Elder Access: Contract Monitoring
          </h3>
          <p className="text-gray-400 text-sm">
            Administrative analytics and deeper ledger inspection will appear here.
          </p>
        </div>
      )}
    </motion.main>
  );
}