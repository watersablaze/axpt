export class AXPTSystemClock {
  private static instance: AXPTSystemClock

  private _time = 0
  private _tick = 0

  static getInstance() {
    if (!this.instance) this.instance = new AXPTSystemClock()
    return this.instance
  }

  now() {
    return this._time
  }

  tick() {
    this._tick += 1
    this._time = this._tick * 200 // deterministic step
    return this._time
  }

  reset() {
    this._time = 0
    this._tick = 0
  }

  getTick() {
    return this._tick
  }
}