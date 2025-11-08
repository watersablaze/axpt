'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './VerifiedDashboard.module.css';
import sigil from '/public/images/axpt.io-2x.png';
import { useTokenStore } from '@/stores/useTokenStore';

const allDocs = {
  'whitepaper.pdf': {
    id: 'whitepaper',
    title: 'AXPT Whitepaper',
    description: 'Explore the full vision, architecture, and protocols of the AXPT ecosystem.',
  },
  'hemp.pdf': {
    id: 'hemp',
    title: 'Hemp Ecosystem Brief',
    description: 'A living overview of regenerative hemp systems in continental Africa.',
  },
  'chinje.pdf': {
    id: 'chinje',
    title: 'Chinje Investment Memo',
    description: 'Internal proposal outlining projected milestones and investment yield models.',
  },
} as const;

type DocKey = keyof typeof allDocs;
type Doc = (typeof allDocs)[DocKey];

export default function VerifiedDashboard() {
  const router = useRouter();
  const { tokenPayload } = useTokenStore();

  const documents: Doc[] =
    tokenPayload?.docs
      ?.map((filename: string) => allDocs[filename.trim() as DocKey])
      .filter(Boolean) ?? [];

  return (
    <div className={styles.verifiedWrapper}>
      <div className={styles.leftPane}>
        <Image src={sigil} alt="AXPT Sigil" className={styles.sigilImage} priority />
        <p className={styles.accessGranted}>ACCESS GRANTED</p>
      </div>

      <div className={styles.rightPane}>
        <div className={`${styles.greetingBox} ${styles.fadeInDelay1}`}>
          <h1 className={styles.welcomeTitle}>Welcome, {tokenPayload?.displayName || 'Partner'}</h1>
          <p className={styles.description}>
            You’ve unlocked access to protected content and features reserved for{' '}
            <strong>{tokenPayload?.tier || 'Partner'}</strong> tier.
          </p>
        </div>

        <div className={`${styles.orientationCard} ${styles.fadeInDelay2}`}>
          <h2>Orientation</h2>
          <p>
            You’ve entered the AXPT secure portal. From here, you may access Documents and relevant
            information about Axis Point as well as proceed to upgrade your token to a full AXPT
            account.
          </p>
        </div>

        <div className={`${styles.documentGrid} ${styles.fadeInDelay3}`}>
          {documents.length > 0 ? (
            documents.map((doc: Doc) => (
              <div key={doc.id} className={styles.docCard}>
                <h3>{doc.title}</h3>
                <p>{doc.description}</p>
                <div className={styles.docActions}>
                  <button
                    className={styles.cardButton}
                    onClick={() => router.push(`/docs/${doc.id}`)}
                  >
                    View
                  </button>
                  <a
                    href={`/docs/AXPT/${docKeyFromId(doc.id)}`}
                    download
                    className={styles.cardButton}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#ccc', fontStyle: 'italic' }}>
              No documents assigned or visible.
            </p>
          )}
        </div>

        <div className={`${styles.actionButtons} ${styles.fadeInDelay4}`}>
          <button className={styles.beginButton} onClick={() => router.push('/account/upgrade')}>
            Begin Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

function docKeyFromId(id: string): string {
  const entry = Object.entries(allDocs).find(([_, val]) => val.id === id);
  return entry?.[0] ?? `${id}.pdf`;
}