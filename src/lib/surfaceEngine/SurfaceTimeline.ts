type Listener = (layer: string) => void

class SurfaceTimeline {

  private active: string = "ORIGIN"
  private listeners: Listener[] = []

  setActive(layer: string) {

    if (this.active === layer) return

    this.active = layer

    this.listeners.forEach(listener => listener(layer))
  }

  subscribe(listener: Listener) {

    this.listeners.push(listener)

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }

  }

  getActive() {
    return this.active
  }

}

export const surfaceTimeline = new SurfaceTimeline()