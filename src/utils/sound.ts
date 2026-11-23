// Tactile Web Audio API sound generator - no external audio files required!

class SoundEngine {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // Countdown beep (short electronic blip)
  playBeep(isFinal: boolean = false) {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = isFinal ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, ctx.currentTime) // A5 or A4

      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.22 : 0.08))

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + (isFinal ? 0.25 : 0.1))
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  }

  // Mechanical tactile shutter click
  playShutter() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime

      // Part 1: Initial mechanical snap
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.05)

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.07)

      // Part 2: White noise mirror slap
      const bufferSize = ctx.sampleRate * 0.07
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(1400, now)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.25, now + 0.01)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      noise.start(now + 0.01)
      noise.stop(now + 0.09)
    } catch {
      // Ignore audio error
    }
  }

  // Tactile button click feedback
  playClick() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.035)
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEngine()
