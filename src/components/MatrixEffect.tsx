'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './MatrixEffect.module.css'; // Adjust path if needed

const MatrixEffect = () => {
  const matrixCode = ['1010', '1101', '0110', '0011', '1001', '1110'];

  return (
    <div className={styles.matrixEffect}>
      {Array.from({ length: 40 }).map((_, index) => (
        <motion.div
          key={index}
          className={styles.matrixBurst}
          initial={{
            opacity: 0,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        >
          {matrixCode
            .slice(0, Math.floor(Math.random() * matrixCode.length + 1))
            .join('\n')}
        </motion.div>
      ))}
    </div>
  );
};

export default MatrixEffect;