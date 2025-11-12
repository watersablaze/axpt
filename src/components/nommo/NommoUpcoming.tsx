'use client';

import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useAnimation,
  useInView,
} from 'framer-motion';
import { useEffect, useRef } from 'react';
import { nommoFeatures } from '@/lib/data/nommoFeatures';
import styles from './NommoUpcoming.module.css';

export default function NommoUpcoming() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Observe when section enters view
  const inView = useInView(sectionRef, { once: true, margin: '-20% 0px' });

  // Soft brightness drift with scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 90%', 'end 40%'],
  });
  const brightness = useTransform(scrollYProgress, [0, 0.4, 1], [0.9, 1, 1]);
  const filter = useMotionTemplate`brightness(${brightness})`;

  const upcoming = nommoFeatures.filter(
    (f) => f.slug !== 'warriors-in-the-garden'
  );

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } },
  };

  useEffect(() => {
    if (inView) controls.start('visible');
  }, [inView, controls]);

  return (
    <motion.section
      ref={sectionRef}
      id="upcoming"
      className={styles.section}
      style={{ filter }}
      initial="hidden"
      animate={controls}
      variants={fadeUp}
    >
      <motion.div className={styles.inner} variants={fadeUp}>
        <h3 className={styles.title}>Upcoming Features</h3>

        <p className={styles.subtitle}>
          Glimpses of the journeys and restorations to come — unfolding through
          the lens of Nommo Media.
        </p>

        <motion.div
          className={styles.grid}
          variants={fadeUp}
          transition={{ staggerChildren: 0.1 }}
        >
          {upcoming.map((feature) => (
            <motion.article
              key={feature.slug}
              className={styles.card}
              variants={fadeUp}
            >
              {feature.thumbnail && (
                <img
                  src={feature.thumbnail}
                  alt={feature.title}
                  className={styles.thumb}
                />
              )}
              <div className={styles.textWrap}>
                <h4 className={styles.cardTitle}>{feature.title}</h4>
                {feature.tagline && (
                  <p className={styles.tagline}>{feature.tagline}</p>
                )}
                <p className={styles.desc}>{feature.description}</p>
                <span className={styles.status}>{feature.status}</span>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}