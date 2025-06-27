'use client';

import React from 'react';
import styles from './VerifiedDashboard.module.css';
import Image from 'next/image';
import Link from 'next/link';
import axptSigil from '/public/images/axpt.io-2x.png';

interface VerifiedDashboardProps {
  partner: string;
  tier: string;
  token: string;
  docs: string[];
}

export default function VerifiedDashboard({ partner, tier, token, docs }: VerifiedDashboardProps) {
  const readableLabel = (filename: string) => {
    if (filename.includes('Whitepaper')) return 'AXPT Whitepaper';
    if (filename.includes('Hemp')) return 'Hemp Ecosystem Brief';
    if (filename.includes('Supermarket')) return 'Supermarket Proposal';
    return filename.replace(/[-_]/g, ' ').replace('.pdf', '');
  };

  const readableDesc = (filename: string) => {
    if (filename.includes('Whitepaper')) return 'Foundational vision and architecture of AXPT.';
    if (filename.includes('Hemp')) return 'Strategic roadmap for the hemp circular economy.';
    if (filename.includes('Supermarket')) return 'Proposal for a national indigenous food chain initiative.';
    return 'Click below to preview or download.';
  };

  return (
    <div className={styles.verifiedWrapper}>
      {/* 🌟 Header Section */}
      <div className={styles.headerWrapper}>
        <Image
          src={axptSigil}
          alt="AXPT Sigil"
          className={styles.sigil}
          width={190}
          height={190}
        />
        <h1 className={styles.heading}>ACCESS GRANTED</h1>
        <p className={styles.subtext}>
          Welcome, <span className={styles.partner}>{partner}</span>
        </p>
        <p className={styles.tierLine}>Tier: <span className={styles.tier}>{tier}</span></p>
      </div>

      {/* 🔀 Main Grid Section */}
      <div className={styles.mainContent}>
        {/* 📄 Left Column: Documents */}
        <div className={styles.docColumn}>
          <h2 className={styles.subheading}>Your Documents</h2>
          <ul className={styles.docList}>
            {docs.map((doc) => (
              <li key={doc} className={styles.docCard}>
                <h4 className={styles.docTitle}>{readableLabel(doc)}</h4>
                <p className={styles.docDesc}>{readableDesc(doc)}</p>
                <div className={styles.docActions}>
                  <Link
                    href={`/docs/AXPT/${doc}`}
                    target="_blank"
                    className={styles.docLink}
                  >
                    🔍 View
                  </Link>
                  <span className={styles.divider}>|</span>
                  <Link
                    href={`/docs/AXPT/${doc}`}
                    download
                    className={styles.docLink}
                  >
                    ⬇️ Download
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 🚀 Right Column: CTA */}
        <div className={styles.ctaBox}>
          <h3 className={styles.ctaTitle}>🚀 Ready to Upgrade?</h3>
          <p className={styles.ctaText}>
            Convert your token into a full AXPT.io account for deeper portal access and participation!
          </p>
          <Link
            href="/account/upgrade"
            className={styles.ctaButton}
          >
            Upgrade to Full Account
          </Link>
        </div>
      </div>
    </div>
  );
}