'use client'

import styles from './CommandCompass.module.css'
import { SURFACES } from '@/lib/surfaces/registry'
import { useLayer } from '@/lib/context/LayerContext'

export default function CommandCompass() {

  const { activeLayer } = useLayer()

  function jumpToSurface(id: string) {

    const el = document.getElementById(id)

    if (!el) return

    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })

  }

  return (

    <nav className={styles.commandCompass}>

      {SURFACES.map((surface) => {

        const active = surface.layer === activeLayer

        return (

          <button
            key={surface.id}
            onClick={() => jumpToSurface(surface.id)}
            className={`${styles.node} ${active ? styles.active : ''}`}
          />

        )

      })}

    </nav>

  )

}