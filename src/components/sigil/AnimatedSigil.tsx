'use client';

import styles from './AnimatedSigil.module.css';

export default function AnimatedSigil() {
  return (
    <div className={styles.sigilWrapper}>
      {/* Globe */}
      <img
        src="/sigil/axpt_base_clean.png"
        alt="Base Globe"
        className={styles.baseGlobe}
      />

      {/* Continent Overlay */}
      <img
        src="/sigil/axpt_continents@2x.webp"
        alt="Continents"
        className={styles.continents}
      />

      {/* Letters */}
      <img src="/sigil/axpt_a@2x.webp" alt="A" className={styles.letterA} />
      <img src="/sigil/axpt_x@2x.webp" alt="X" className={styles.letterX} />
      <img src="/sigil/axpt_p@2x.webp" alt="P" className={styles.letterP} />
      <img src="/sigil/axpt_t@2x.webp" alt="T" className={styles.letterT} />
      <img src="/sigil/io@2x.webp" alt="io" className={styles.ioMark} />

      {/* Feathers */}
      <img
        src="/sigil/left_feather_1@2x.webp"
        alt="Left Feather 1"
        className={styles.leftFeather1}
      />
      <img
        src="/sigil/left_feather_2@2x.webp"
        alt="Left Feather 2"
        className={styles.leftFeather2}
      />
      <img
        src="/sigil/left_feather_3@2x.webp"
        alt="Left Feather 3"
        className={styles.leftFeather3}
      />
      <img
        src="/sigil/left_feather_4@2x.webp"
        alt="Left Feather 4"
        className={styles.leftFeather4}
      />

      <img
        src="/sigil/right_feather_1@2x.webp"
        alt="Right Feather 1"
        className={styles.rightFeather1}
      />
      <img
        src="/sigil/right_feather_2@2x.webp"
        alt="Right Feather 2"
        className={styles.rightFeather2}
      />
      <img
        src="/sigil/right_feather_3@2x.webp"
        alt="Right Feather 3"
        className={styles.rightFeather3}
      />
      <img
        src="/sigil/right_feather_4@2x.webp"
        alt="Right Feather 4"
        className={styles.rightFeather4}
      />

      {/* Wing Text */}
      <img
        src="/sigil/axispoint_wing_text@2x.webp"
        alt="AxisPoint"
        className={styles.wingText}
      />

      {/* Subtext */}
      <div className={styles.subtext}>
        Indigenous Futurism Custodial Trust Chamber
      </div>
    </div>
  );
}