import type { Metadata } from 'next'

import FWThreshold from '@/components/french-ward/FWThreshold'
import FWLaunchBody from '@/components/french-ward/FWLaunchBody'
import FWFooter from '@/components/french-ward/FWFooter'

import styles from './FrenchWardPage.module.css'

export const metadata: Metadata = {
  title: 'French-Ward — Trade, Authority & Passage',
  description:
    'French-Ward coordinates source-side relationships, commercial documentation, institutional readiness, and responsible cross-border trade.',
  openGraph: {
    title: 'French-Ward',
    description:
      'Trade, authority, documentation, passage, and institutional coordination.',
    type: 'website',
  },
}

export default function FrenchWardPage() {
  return (
    <main className={styles.page} id="french-ward">
      <FWThreshold />

      <FWLaunchBody />

      <FWFooter />
    </main>
  )
}
