// 📁 components/onboarding/VerifiedDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTokenStore } from '@/stores/useTokenStore';
import { formatDistanceToNow } from 'date-fns';

import OrbAnimation from '@/components/shared/OrbAnimation';
import ProfilesRadial from '@/components/onboarding/ProfilesRadial';
import DocCardGrid from '@/components/shared/DocCardGrid';
import ParticleOverlay from '@/components/shared/ParticleOverlay';

import styles from './VerifiedDashboard.module.css';

export default function VerifiedDashboard() {
  const { decoded, token } = useTokenStore();
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  if (!decoded) {
    return (
      <div className={styles.errorMessage}>
        Invalid or missing token. Please return to the Welcome Screen.
      </div>
    );
  }

  const expiresIn = decoded.exp
    ? formatDistanceToNow(new Date(decoded.exp * 1000), { addSuffix: true })
    : 'Unknown';

  return (
    <div className={styles.dashboardWrapper}>
      <ParticleOverlay />


      <aside className={styles.sidebar}>
        <div className={styles.sigilContainer}>
          <Image
            src="/images/axpt-sigil.png"
            alt="AXPT Sigil"
            width={360}
            height={360}
            className={styles.sigilImage}
          />
          <div className={styles.status}>ACCESS GRANTED</div>
          <div className={styles.expiry}>Token expires {expiresIn}</div>
          {decoded.displayName && (
            <div className={styles.displayName}>{decoded.displayName}</div>
          )}
          <div className={styles.sigilGlow} />

          {showPopup && (
            <div className={styles.popupMessageMoved}>
              <button
                onClick={() => setShowPopup(false)}
                className={styles.popupCloseButton}
                aria-label="Close notification"
              >
                ×
              </button>
              <div className={styles.popupText}>
                {decoded.popupMessage ?? 'Vault unlocked. Temporary access granted.'}
              </div>
            </div>
          )}
        </div>

        <div className={styles.sidebarBlurb}>
          <p>
            AXPT.io is the threshold. A decentralized bridge for Earth-aligned
            currencies, sacred trade, and project portals powered by purpose.
            If you’re here, the portal has opened—because you carry something the
            future needs.
          </p>
        </div>

        <div className={styles.sidebarLink}>
          <Link href="/onboard/investor/upgrade">Ready to Upgrade?</Link>
        </div>

        <div className={styles.axptTagline}>AXPT.io</div>
      </aside>

      <main className={styles.portalMain}>
        <div className={styles.headerShell}>
          <div className={styles.greetingText}>
            <p>
              Enjoy this curated dashboard to inform yourself on the AXPT.io ecosystem opportunities.
              These materials are entrusted to those restoring balance, backing Earth-aligned
              futures, and remembering the original codes.
            </p>
          </div>
          <hr className={styles.headerDivider} />
        </div>

        <div className={styles.profilesShell}>
          <div className={styles.constellationDivider}></div>
          <ProfilesRadial />
        </div>

        <section className={styles.rippleVaultShell}>
          <div className={styles.documentVaultSection}>
            <DocCardGrid
              heading="Document Vault"
              folder="AXPT"
              filenames={decoded.docs ?? []}
              token={decoded.token ?? token ?? ''}
            />
          </div>

          <div id="orientation" className={styles.orientationSection}>
            <div className={styles.orientationContent}>
              <div className={styles.orientationLeft}>
                <h3 className={styles.orientationTitle}>Orientation</h3>
                <p>
                  COMING SOON: A visual presentation of AXPT’s core initiatives
                  and opportunities to align.
                </p>
              </div>
              <div className={styles.orientationRight}>
                <div className={styles.orbButtonWrapper}>
                  <OrbAnimation />
                  <Link href="/onboard/investor/upgrade" className={styles.beginUpgrade}>
                    BEGIN UPGRADE
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}