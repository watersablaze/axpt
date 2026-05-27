import styles from './EthosSurface.module.css'
import SurfaceHeader from '@/components/surfaces/SurfaceHeader'

const CIRCULATION_CHANNELS = [
  {
    title: 'Cultural Exchange',
    text: 'Cross-border participation structured through consent, context, and reciprocal value.',
  },
  {
    title: 'Restorative Media',
    text: 'Narrative systems maintained as record, witness, and authorship infrastructure.',
  },
  {
    title: 'Regenerative Systems',
    text: 'Economic participation oriented toward preservation, repair, and long-term continuity.',
  },
  {
    title: 'Shared Custodianship',
    text: 'Ledger, policy, treasury, and broadcast held as coordinated institutional responsibility.',
  },
]

function CirculationChannel({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <article className={styles.circulationChannel}>
      <div className={styles.channelBody}>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  )
}

export default function EthosSurface() {

  return (

    <div className={styles.ethosSurface}>

      <div className="surfaceFrame">

        <div className={styles.ethosInner}>

        <SurfaceHeader
          kicker="CIRCULATION"
          title="Infrastructure must remain accountable to what it moves."
          subline="AXPT connects systems of value, record, narrative, and participation without separating coordination from responsibility."
        />

      <div className={styles.circulationRiver}>
        {CIRCULATION_CHANNELS.map((channel) => (
          <CirculationChannel
            key={channel.title}
            title={channel.title}
            text={channel.text}
          />
        ))}
      </div>

        </div>

      </div>

    </div>
  )
}
