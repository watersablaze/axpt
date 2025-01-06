import React from 'react';
import { motion } from 'framer-motion';
import styles from './PathAnimation.module.css';

const PathAnimation = () => {
  return (
    <div className={styles.pathsContainer}>
      {/* Generate symmetrical lines */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={styles.line}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{
            scaleY: [0, 1, 0.8, 1],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            delay: i * 0.2,
          }}
          style={{
            transform: `rotate(${(i / 12) * 360}deg) translateY(-50%)`,
          }}
        ></motion.div>
      ))}

      {/* Central Glow */}
      <div className={styles.centerGlow}></div>
    </div>
  );
};

export default PathAnimation;