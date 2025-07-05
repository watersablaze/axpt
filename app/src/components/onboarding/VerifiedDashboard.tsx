'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTokenStore } from '@/stores/useTokenStore';
import styles from './VerifiedDashboard.module.css';
import sigil from '/public/images/axpt.io-2x.png';
import DocCard from '@/components/shared/DocCard';

export default function VerifiedDashboard() {
  const { decoded } = useTokenStore();
  const router = useRouter();

  const documents = decoded?.docs || [];

  const handleUpgradeClick = () => {
    router.push('/account/upgrade');
  };

  return (
    <div className={styles.verifiedWrapper}>
      <div className={styles.leftPane}>
        <Image src={sigil} alt="AXPT Sigil" className={styles.sigilImage} />
        <p className={styles.accessGranted}>ACCESS GRANTED</p>
      </div>

      <div className={styles.rightPane}>
        <h1 className={styles.welcomeTitle}>Welcome to AXPT.io</h1>

        <div className={styles.greetingBox}>
          <p className={styles.description}>
            Explore early access documents curated for visionaries and stewards of the future.
            This portal marks your entry into the sacred vault. Discover our architecture, values, 
            and invitations to build with us.
          </p>
        </div>

        <div className={styles.documentGrid}>
          {documents.map((doc) => (
            <DocCard key={doc} filename={doc} />
          ))}
        </div>

        <div className={styles.orientationGrid}>
          <div className={styles.orientationSplit}>
            <div className={styles.orientationLeft}>
              <h3>Orientation</h3>
              <p>
                COMING SOON: A visual presentation of AXPT’s core initiatives and opportunities to
                align with the mission.
              </p>
            </div>
            <div className={styles.orientationRight}>
              <button className={styles.upgradeButton} onClick={handleUpgradeClick}>
                Begin Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}