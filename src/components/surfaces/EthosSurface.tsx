'use client'

import styles from './EthosSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'
import { useEffect, useRef } from 'react'

function EthosPillar({
  index,
  title,
  text,
}: {
  index: string
  title: string
  text: string
}) {

  return (
    <div className={styles.pillar}>

      <span className={styles.index}>{index}</span>

      <div className={styles.pillarBody}>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

    </div>
  )
}

export default function EthosSurface() {

  const containerRef = useRef<HTMLDivElement>(null)

  const pillars = [
    {
      index: '01',
      title: 'Cultural Exchange',
      text: 'Flows structured across continents through consent and reciprocal presence.',
    },
    {
      index: '02',
      title: 'Restorative Journalism',
      text: 'Media held as living record — restoring authorship, lived context, and continuity.',
    },
    {
      index: '03',
      title: 'Sustainability',
      text: 'Participation shaped toward regeneration rather than extraction.',
    },
    {
      index: '04',
      title: 'Custodianship',
      text: 'Ledger, policy, and broadcast maintained as shared responsibility.',
    },
  ]

  useEffect(() => {

    const nodes = containerRef.current?.querySelectorAll(`.${styles.pillar}`)

    if (!nodes) return

    const observer = new IntersectionObserver(

      (entries) => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            nodes.forEach(n => n.classList.remove(styles.isActive))

            entry.target.classList.add(styles.isActive)

          }

        })

      },

      {
        threshold: 0.6,
      }

    )

    nodes.forEach(n => observer.observe(n))

    return () => observer.disconnect()

  }, [])

  return (

    <section
      className={`surface ${styles.ethosSurface}`}
      data-layer="ETHOS"
      aria-label="Institutional Ethos"
    >

      <div className="surfaceFrame">

        <div className={styles.ethosInner}>

          <SurfaceHeader
            kicker="CIRCULATION"
            title="Custodial Systems in Motion"
            subline="AXPT aligns capital, culture, and narrative so exchange remains accountable and regenerative."
          />

          <div ref={containerRef} className={styles.pillars}>

            {pillars.map((pillar) => (

              <EthosPillar
                key={pillar.index}
                index={pillar.index}
                title={pillar.title}
                text={pillar.text}
              />

            ))}

          </div>

        </div>

      </div>

    </section>
  )
}