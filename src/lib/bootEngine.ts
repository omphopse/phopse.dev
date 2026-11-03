import { carLaunch, launchAt, raceEnd } from './bootCircuit'

const engineVolume = 0.50
const passIndexes = [3, 9, 14, 22, 29, 37]

export function startEngine(getElapsed: () => number) {
  if (getElapsed() >= raceEnd - 150) return null

  let audio: AudioContext
  try { audio = new AudioContext() } catch { return null }

  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    void audio.close().catch(() => undefined)
  }

  const ready = (async () => {
    try {
      await audio.resume()
      const elapsed = getElapsed()
      if (stopped || elapsed >= raceEnd - 150 || audio.state !== 'running') {
        stop()
        return false
      }

      const now = audio.currentTime
      const end = now + (raceEnd - elapsed) / 1000
      const master = audio.createGain()
      master.gain.setValueAtTime(0.001, now)
      // Hold the mix through the launch, then fade along the visual timeline.
      const fadeStart = 6100
      const levelAt = (ms: number) => {
        const progress = Math.max(0, Math.min(1, (ms - fadeStart) / (raceEnd - fadeStart)))
        return engineVolume * (.001 / engineVolume) ** progress
      }
      master.gain.exponentialRampToValueAtTime(levelAt(elapsed + 90), now + .09)
      if (elapsed + 90 < fadeStart) {
        master.gain.setValueAtTime(engineVolume, now + (fadeStart - elapsed) / 1000)
      }
      master.gain.exponentialRampToValueAtTime(.001, end)
      const compressor = audio.createDynamicsCompressor()
      compressor.threshold.value = -9
      compressor.knee.value = 6
      compressor.ratio.value = 4
      compressor.attack.value = .004
      compressor.release.value = .14
      master.connect(compressor).connect(audio.destination)

      const filter = audio.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 960
      filter.connect(master)

      // Each voice combines several combustion harmonics. Offset their rev
      // curves and pan positions so the grid rises as a field.
      for (let i = 0; i < 8; i++) {
        const voice = audio.createOscillator()
        voice.setPeriodicWave(audio.createPeriodicWave(
          new Float32Array(7),
          Float32Array.of(0, 1, .32, .24 + i * .027, .19, .08, .07),
        ))
        const gain = audio.createGain()
        const pan = audio.createStereoPanner()
        gain.gain.value = i === 0 ? .18 : .074
        pan.pan.value = i === 0 ? 0 : (i - 4) * .16
        voice.connect(gain).connect(pan).connect(filter)

        const base = i === 0 ? 34 : 49 + i * 7
        const pitch = (ms: number) => {
          const buildup = Math.min(1, ms / launchAt)
          const acceleration = Math.max(0, Math.min(1, (ms - launchAt + 240 - i * 52) / 900))
          const recede = Math.max(0, (ms - 5650) / 2600)
          const rev = Math.sin(ms / (215 + i * 23) + i * 2.1)
          return base * (1 + buildup * .43 + acceleration * .89 - recede * .95 + rev * .09)
        }
        voice.frequency.setValueAtTime(pitch(elapsed), now)
        for (let ms = elapsed + 120; ms < raceEnd; ms += 120) {
          voice.frequency.linearRampToValueAtTime(pitch(ms), now + (ms - elapsed) / 1000)
        }
        voice.start(now)
        voice.stop(end)
      }

      const pass = audio.createOscillator()
      pass.type = 'triangle'
      const envelope = audio.createGain()
      envelope.gain.value = .001
      const pan = audio.createStereoPanner()
      pass.connect(envelope).connect(pan).connect(filter)
      for (const index of passIndexes) {
        const cue = now + (carLaunch(index) + 380 - elapsed) / 1000
        if (cue < now || cue + .26 > end) continue
        const side = index % 2 ? 1 : -1
        pan.pan.setValueAtTime(side * .15, cue)
        pan.pan.linearRampToValueAtTime(side * .72, cue + .26)
        pass.frequency.setValueAtTime(204 + index % 7 * 9, cue)
        pass.frequency.exponentialRampToValueAtTime(120, cue + .26)
        envelope.gain.setValueAtTime(.001, cue)
        envelope.gain.exponentialRampToValueAtTime(index === 37 ? .34 : .21, cue + .1)
        envelope.gain.exponentialRampToValueAtTime(.001, cue + .26)
      }
      pass.start(now)
      pass.stop(end)
      return true
    } catch {
      stop()
      return false
    }
  })()

  return { ready, stop }
}

