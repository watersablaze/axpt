import styles from './EthosSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'

const PILLARS = [
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

  return (

    <div className={styles.ethosSurface}>

      <div className="surfaceFrame">

        <div className={styles.ethosInner}>

          <SurfaceHeader
            kicker="CIRCULATION"
            title="Custodial Systems in Motion"
            subline="AXPT aligns capital, culture, and narrative so exchange remains accountable and regenerative."
          />

          <div className={styles.pillars}>

            {PILLARS.map((pillar) => (

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

    </div>
  )
}
