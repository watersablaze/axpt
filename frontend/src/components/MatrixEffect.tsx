import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './MatrixEffect.module.css';

const MatrixEffect = () => {
  const matrixCode = ['1010', '1101', '0110', '0011', '1001', '1110'];
  const [bursts, setBursts] = useState<
    { top: string; left: string; delay: number; content: string }[]
  >([]);

  // Generate random values only on the client side
  useEffect(() => {
    const generateBursts = () =>
      Array.from({ length: 40 }).map(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        content: matrixCode
          .slice(0, Math.floor(Math.random() * matrixCode.length + 1))
          .join('\n'),
      }));

    setBursts(generateBursts());
  }, []);

  return (
    <div className={styles.matrixEffect}>
      {bursts.map((burst, index) => (
        <motion.div
          key={index}
          className={styles.matrixBurst}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: burst.delay,
          }}
          style={{
            top: burst.top,
            left: burst.left,
          }}
        >
          {burst.content}
        </motion.div>
      ))}
    </div>
  );
};

export default MatrixEffect;