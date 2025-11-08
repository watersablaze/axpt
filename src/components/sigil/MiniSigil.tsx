'use client';

import Image from 'next/image';
import styles from './MiniSigil.module.css';

export default function MiniSigil() {
  return (
    <div className={styles.wrapper}>
      <Image
        src="/sigil/sigil_center_version.png"
        alt="AXPT Sigil"
        width={400}
        height={400}
        className={styles.image}
        priority
      />
    </div>
  );
}

