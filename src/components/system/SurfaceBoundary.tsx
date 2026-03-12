'use client'

import React, { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export default class SurfaceBoundary extends React.Component<Props, State> {

  state: State = {
    hasError: false
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {

    if (this.state.hasError) {
      return (
        <section className="surface-error">
          Surface failed to load
        </section>
      )
    }

    return this.props.children
  }
}