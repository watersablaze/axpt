'use client'

import styles from './NavCompass.module.css'
import { SURFACES } from '@/lib/surfaces/registry'
import { useLayer } from '@/lib/context/LayerContext'

export default function NavCompass() {

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

    <nav className={styles.navCompass}>

      {SURFACES.map(({ id, layer }) => {

        const active = layer === activeLayer

        return (

          <button
            key={id}
            onClick={() => jumpToSurface(id)}
            className={`${styles.node} ${active ? styles.active : ''}`}
          />

        )

      })}

    </nav>

  )

}