import type { Metadata } from 'next'

import FWThreshold from '@/components/french-ward/FWThreshold'
import FWInstitutionalRail from '@/components/french-ward/FWInstitutionalRail'
import FWField from '@/components/french-ward/FWField'
import FWArchive from '@/components/french-ward/FWArchive'
import FWDoctrine from '@/components/french-ward/FWDoctrine'
import FWFooter from '@/components/french-ward/FWFooter'

import styles from './FrenchWardPage.module.css'

export const metadata: Metadata = {
  title: 'French-Ward Field Notes — Trade, Authority & Passage',
  description:
    'French-Ward Field Notes examines the structures beneath trade: source authority, documentary readiness, lawful passage, settlement, and institutional continuity.',
  openGraph: {
    title: 'French-Ward Field Notes',
    description:
      'When Gold Exists but Passage Is Not Yet Governed — Field Note 001 from French-Ward.',
    type: 'article',
  },
}

export default function FrenchWardPage() {
  return (
    <main className={styles.page} id="french-ward">
      <FWThreshold />

      <section className={styles.body}>
        <aside className={styles.railColumn}>
          <FWInstitutionalRail />
        </aside>

        <div className={styles.fieldColumn}>
          <FWField />
        </div>
      </section>

      <FWArchive />

      <FWDoctrine />

      <FWFooter />
    </main>
  )
}
