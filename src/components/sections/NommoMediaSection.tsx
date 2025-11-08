'use client';

import styles from './NommoMediaSection.module.css';
import AnimatedSectionWrapper from './AnimatedSectionWrapper';
import SectionButton from '../ui/SectionButton';

export default function NommoMediaSection() {
  return (
    <section id="nommo" className={styles.section}>
      <AnimatedSectionWrapper>
        <h2 className={styles.heading}>Nommo Media</h2>
        <p className={styles.text}>
          Our multimedia wing curates stories, films, and soundscapes that reflect the soul of the diaspora.
          Nommo is the voice, the word, the breath of ancestral memory expressed in the present. This is Restorative 
          journalism.
        </p>

        <div style={{ marginTop: '2rem' }}>
          <SectionButton href="https://www.youtube.com/@NommoMedia" target="_blank">
            Visit Nommo Media
          </SectionButton>
        </div>
      </AnimatedSectionWrapper>
    </section>
  );
}