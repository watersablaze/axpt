'use client'

import { useLayoutEffect } from 'react'

export default function DocumentReadyGate() {
  useLayoutEffect(() => {
    const root =
      document.documentElement

    const app =
      document.getElementById('app-content')

    const isCanonicalHomepageEntry =
      window.location.pathname === '/' &&
      !window.location.hash


    /*
     * Normalize canonical homepage entry before revealing the app.
     */

    if (isCanonicalHomepageEntry) {
      history.scrollRestoration = 'manual'

      root.style.scrollBehavior = 'auto'

      window.scrollTo(0, 0)
    }


    /*
     * DOCUMENT READINESS
     *
     * D6 prevents the Threshold sequence from
     * progressing until this attribute exists.
     */

    root.dataset.documentReady = 'true'

    if (app) {
      app.style.visibility = 'visible'
    }


    /*
     * Entry normalization is complete.
     * Return scrolling behavior to stylesheet law.
     */

    if (isCanonicalHomepageEntry) {
      root.removeAttribute(
        'data-entry-normalizing'
      )

      root.style.removeProperty(
        'scroll-behavior'
      )
    }

  }, [])

  return null
}
